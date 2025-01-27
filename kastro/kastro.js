import { plugin } from "bun";
import { cp, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { transpileCss } from "../kdjs/cssParser";
import { transpileJsx } from "../kdjs/jsxParser";
import { Blue, Clear, parseArgs } from "../util/cli";
import { combine, getDir, getExt } from "../util/paths";
import compiler from "./compiler/compiler";
import crates from "./compiler/crates";
import { ttfTarget, woff2Target } from "./compiler/font";
import {
  inlineSvgTarget,
  jsxSvgTarget,
  pngTarget,
  svgTarget,
  webpTarget
} from "./compiler/image";
import { pageTarget } from "./compiler/page";
import { getDomIdMapper, getGlobals } from "./compiler/pageGlobals";
import { scriptTarget } from "./compiler/script";
import { stylesheetTarget } from "./compiler/stylesheet";
import { registerTargetFunction } from "./compiler/targetRegistry";
import { CompressedMimes } from "./workers/mimes";

const setupKastro = (buildMode) => {
  setDomIdMapper(buildMode);

  registerTargetFunction(".html", pageTarget);
  registerTargetFunction(".inl.svg", inlineSvgTarget);
  registerTargetFunction(".png", pngTarget);
  registerTargetFunction(".svg", svgTarget);
  registerTargetFunction(".jsx.svg", jsxSvgTarget);
  registerTargetFunction(".css", stylesheetTarget);
  registerTargetFunction(".webp", webpTarget);
  registerTargetFunction(".ttf", ttfTarget);
  registerTargetFunction(".woff2", woff2Target);
  registerTargetFunction(".js", scriptTarget);
  registerTargetFunction(".jsx", scriptTarget);

  plugin({
    name: "kastro-js",
    async setup(build) {
      const cwdLen = process.cwd().length + 1;
      const path = (args) => args.path.slice(cwdLen);

      build.onLoad({ filter: /\.(svg|png|webp)$/ }, (args) => {
        const code = `import { Image } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => Image({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const code = `import { makeStyleSheet } from "@kimlikdao/lib/kastro/stylesheet";\n` +
          `import { readFileSync } from "node:fs";\n` +
          `export default makeStyleSheet("${path(args)}", readFileSync("${path(args)}", "utf-8"));`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.ttf$/ }, (args) => {
        const code = `import { TtfFont } from "@kimlikdao/lib/kastro/font";\n` +
          `export default (props) => TtfFont({...props, href: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onResolve({ filter: /./, namespace: "kastro" }, ({ path, importer }) => ({
        path: path.startsWith(".") ? "/" + combine(getDir(importer.replace("kastro:", "")), path) : path,
        namespace: "kastro"
      }));
      build.onLoad({ filter: /.svg.jsx$/, namespace: "kastro" }, (args) => {
        const code = `import { SvgJsxImage } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => SvgJsxImage({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /.jsx$/, namespace: "kastro" }, (args) => {
        const code = `import { Script } from "@kimlikdao/lib/kastro/script";\n` +
          `export default (props) => Script({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
    },
  });

  class SinkElement {
    constructor(name) {
      this.name = name;
    }
    get children() { return [this, this, this, this, this] }
    get firstElementChild() { return this; }
    get nextSibling() { return this; }
    get parentElement() { return this; }
    get parentNode() { return this; }
    get previousElementSibling() { return this; }
    get previousSibling() { return this; }

    cloneNode(deep) { return this; }
    replaceChild(newChild, oldChild) { return this; }
    appendChild() { return this; }
    closest() { return this; }

    get classList() {
      return {
        add: () => { },
        remove: () => { },
        contains: () => false,
        toggle: () => false
      };
    }
    get style() {
      return new Proxy({}, {
        get: () => "",
        set: () => true
      });
    }
  }

  const window = {
    ethereum: {
      isRabby: false
    },
  }
  globalThis.GEN = true;
  globalThis.window = window;
  globalThis.document = {
    cookie: "",
    getElementById: (id) => {
      console.warn(`use typed dom.elem() methods instead! ${id}`);
      return new SinkElement("");
    },
  };
  globalThis.document.createElement = (name) => new SinkElement(name);
}

const serveCrate = async (crateName, buildMode) => {
  setupKastro(buildMode);
  const crate = await import(crateName);
  /** @const {!Object<string, PageTarget>} */
  const map = crates.getPageTargets(crate, buildMode);
  /** @const {!DomIdMapper} */
  const domIdMapper = getDomIdMapper();

  let currentPageProps;
  let currentPageGlobalsPattern;

  createServer({
    appType: "mpa",
    publicDir: buildMode == compiler.BuildMode.Dev ? "" : "build/crate",
    plugins: [{
      name: "kastro-js",
      enforce: "pre",

      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.originalUrl in map) {
            res.setHeader("content-type", "text/html;charset=utf-8");
            server.moduleGraph.invalidateAll();
            currentPageProps = map[req.originalUrl];
            compiler.forceBuildTarget(currentPageProps.targetName, currentPageProps)
              .then((content) => {
                const globals = getGlobals();
                globals.GEN = false;
                currentPageGlobalsPattern = new RegExp(Object.keys(globals)
                  .map((key) => `/\\*\\* @define \\{[^}]*\\} \\*/\\s*const ${key} =.*?;`)
                  .join("|"), "g");
                res.end(content)
              });
          } else next();
        })
      },

      resolveId(source, importer) {
        if (source.endsWith(".css"))
          return importer.slice(0, importer.lastIndexOf("/") + 1) + source + ".js";
      },

      load(id) {
        if (id.endsWith(".css.js"))
          return readFile(id.slice(0, -3), "utf8")
            .then((css) => transpileCss(id.slice(0, -3), css, domIdMapper));
      },

      transform(code, id) {
        if (id.endsWith(".jsx"))
          code = transpileJsx(code);
        const globals = getGlobals();
        return code.replace(currentPageGlobalsPattern, (match) => {
          const constIdx = match.indexOf("const");
          const varName = match.slice(match.indexOf("\nconst") + 6, match.indexOf("=", constIdx)).trim();
          return `\nconst ${varName} = ${JSON.stringify(globals[varName])};`
        });
      }
    }]
  }).then((vite) => vite.listen(8787))
    .then(console.log("Dev server running at http://localhost:8787"));
}

/**
 * @param {string} crateName
 * @param {compiler.BuildMode} buildMode
 * @param {?LangCode} lang
 */
const buildCrate = async (crateName, buildMode, lang) => {
  const crate = await import(crateName);
  if (!lang) {
    // If no language is specified, spawn a bun instance for each language.
    // For now we do this sequentially since each page saturates the CPUs.
    const langs = crates.getLanguages(crate);
    for (const lang of langs) {
      console.info(`${Blue}[Building]${Clear} MPA ${lang}`);
      await Bun.spawn(["bun", "lib/kastro/kastro.js", "build", "--lang", lang], {
        env: { NODE_ENV: "production" },
        stdio: ["inherit", "inherit", "inherit"]
      }).exited;
    }
    if (crate.Aliases) {
      const tasks = [];
      for (const alias in crate.Aliases) {
        const exts = CompressedMimes[getExt(alias)] ? [""] : ["", ".br", ".gz"];
        for (const ext of exts)
          tasks.push(cp(`build/crate/${crate.Aliases[alias]}${ext}`, `build/crate/${alias}${ext}`));
      }
      await Promise.all(tasks);
    }
    return;
  }
  // If a language is specified, build each page for that language.
  setupKastro(buildMode);
  /** @const {!Object<string, PageTarget>} */
  const map = crates.getPageTargets(crate, buildMode, lang);

  for (const page of Object.values(map)) {
    console.info(`${Blue}[Building]${Clear} Page ${page.bundleName}`);
    await compiler.bundleTarget(page.targetName, page);
  }
}

/**
 * @param {string} crateName
 * @param {string} target
*/
const deployCrate = (crateName, target) => Promise.all([
  buildCrate(crateName, compiler.BuildMode.Compiled),
  import(`${process.cwd()}/.secrets.js`),
  import(`./${target}/crate.js`)
])
  .then(([_, secrets, crateDeployer]) => crateDeployer.deploy(crateName, secrets, compiler.getNamedAssets()));

const args = parseArgs(process.argv.slice(2), "command");
/** @const {string} */
const crateName = (Array.isArray(args["command"]) ? args["command"][1] : "") + "/crate.js";

if (args["command"] == "serve")
  serveCrate(crateName, args["compiled"] ? compiler.BuildMode.Compiled : compiler.BuildMode.Dev);
else if (args["command"] == "build")
  buildCrate(crateName, compiler.BuildMode.Release, args["lang"]);
else if (args["command"] == "deploy")
  deployCrate(crateName, args["target"] || "cloudflare");

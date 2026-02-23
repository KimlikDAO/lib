import { plugin, spawn } from "bun";
import { cp } from "node:fs/promises";
import process from "node:process";
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
import { scriptTarget } from "./compiler/script";
import { styleSheetTarget } from "./compiler/styleSheet";
import { registerTargetFunction } from "./compiler/target";
import { CompressedMimes } from "./workers/mimes";

const setupKastro = () => {
  registerTargetFunction(".html", pageTarget);
  registerTargetFunction(".inl.svg", inlineSvgTarget);
  registerTargetFunction(".png", pngTarget);
  registerTargetFunction(".svg", svgTarget);
  registerTargetFunction(".jsx.svg", jsxSvgTarget);
  registerTargetFunction(".css", styleSheetTarget);
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
      build.onLoad({ filter: /.js$/, namespace: "kastro" }, (args) => {
        const code = `import { Worker } from "@kimlikdao/lib/kastro/script";\n` +
          `export default (props) => Worker({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
    },
  });

  class SinkElement {
    constructor(name) {
      this.name = name;
    }
    get children() { return [this, this, this, this, this]; }
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
    location: {
      hash: "",
    },
    addEventListener(name, handler) { },
    dispatchEvent(event) { }
  };
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

  /**
   * @template T
   * @this {Array<T>}
   * @param {function(T, number=): void} lambda 
   * @return {!Array<T>}
   */
  Array.prototype.modify = function (lambda) {
    for (let i = 0, n = this.length; i < n; ++i)
      lambda(this[i], i);
    return this;
  };
}

const serveCrate = async (crateName, buildMode) => {
  setupKastro(buildMode);
  const crate = await import(crateName);
  /** @const {Record<string, PageTarget>} */
  const map = crates.getPageTargets(crate, buildMode);
  console.log(map);
}

/**
 * @param {string} crateName
 * @param {compiler.BuildMode} buildMode
 * @param {LangCode | null} lang
 */
const buildCrate = async (crateName, buildMode, lang) => {
  const crate = await import(crateName);
  if (!lang) {
    // If no language is specified, spawn a bun instance for each language.
    // For now we do this sequentially since each page saturates the CPUs.
    const langs = crates.getLanguages(crate);
    for (const lang of langs) {
      console.info(`${Blue}[Building]${Clear} MPA ${lang}`);
      await spawn({
        cmd: ["bun", "lib/kastro/kastro.js", "build", "--lang", lang],
        env: { ...process.env, NODE_ENV: "production" },
        stdio: ["inherit", "inherit", "inherit"]
      }).exited;
    }
    if (crate.Aliases) {
      const tasks = [];
      for (const alias in crate.Aliases) {
        const exts = CompressedMimes[getExt(alias)] ? [""] : ["", ".br", ".gz"];
        for (const ext of exts)
          tasks.push(cp(`build/bundle/${crate.Aliases[alias]}${ext}`, `build/bundle/${alias}${ext}`));
      }
      await Promise.all(tasks);
    }
    return;
  }
  // If a language is specified, build each page for that language.
  setupKastro();
  /** @const {Record<string, PageTarget>} */
  const map = crates.getPageTargets(crate, buildMode, lang);

  for (const page of Object.values(map))
    if (["mint", "en"].includes(page.bundleName)) {
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
  buildCrate(crateName, compiler.BuildMode.Compiled, args["lang"]);
else if (args["command"] == "deploy")
  deployCrate(crateName, args["target"] || "cloudflare");


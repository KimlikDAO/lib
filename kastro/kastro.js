import { plugin } from "bun";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { parseArgs } from "../util/cli";
import { combine, getDir } from "../util/paths";
import compiler from "./compiler/compiler";
import { ttfTarget, woff2Target } from "./compiler/font";
import {
  inlineSvgJsxTarget,
  inlineSvgTarget,
  pngTarget,
  svgJsxTarget,
  svgTarget,
  webpTarget
} from "./compiler/image";
import { pageTarget } from "./compiler/page";
import { getGlobals } from "./compiler/pageGlobals";
import { scriptTarget } from "./compiler/script";
import { stylesheetTarget } from "./compiler/stylesheet";
import { registerTargetFunction } from "./compiler/targetRegistry";

const setupKastro = () => {
  registerTargetFunction(".html", pageTarget);
  registerTargetFunction(".inl.svg", inlineSvgTarget);
  registerTargetFunction(".inl.svg.jsx", inlineSvgJsxTarget);
  registerTargetFunction(".png", pngTarget);
  registerTargetFunction(".svg", svgTarget);
  registerTargetFunction(".svg.jsx", svgJsxTarget);
  registerTargetFunction(".css", stylesheetTarget);
  registerTargetFunction(".webp", webpTarget);
  registerTargetFunction(".ttf", ttfTarget);
  registerTargetFunction(".woff2", woff2Target);
  registerTargetFunction(".js", scriptTarget);

  plugin({
    name: "kastro-js",
    async setup(build) {
      const cwdLen = process.cwd().length + 1;
      const moduleDir = getDir(import.meta.url.slice(6));
      const stylesheetLoader = await readFile("/" + combine(moduleDir, "./compiler/loader/stylesheetLoader.js"), "utf8");
      const scriptLoader = await readFile("/" + combine(moduleDir, "./compiler/loader/scriptLoader.js"), "utf8");

      const imageComponent = (args) => {
        const code = `import { Image } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => Image({...props, src: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      }

      build.onLoad({ filter: /\.(svg|png|webp)$/ }, imageComponent);
      build.onLoad({ filter: /\.css$/ }, (args) => ({
        contents: stylesheetLoader.replace("SOURCE", args.path.slice(cwdLen)),
        loader: "js"
      }));
      build.onLoad({ filter: /\.ttf$/ }, (args) => {
        const code = `import { TtfFont } from "@kimlikdao/lib/kastro/font";\n` +
          `export default (props) => TtfFont({...props, href: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
      build.onResolve({ filter: /./, namespace: "kastro" }, ({ path, importer }) => ({
        path: path.startsWith(".") ? "/" + combine(getDir(importer.replace("kastro:", "")), path) : path,
        namespace: "kastro"
      }));
      build.onLoad({ filter: /.js$/, namespace: "kastro" }, (args) => ({
        contents: scriptLoader.replace("SOURCE", args.path.slice(cwdLen)),
        loader: "js"
      }));
      build.onLoad({ filter: /.svg.jsx$/, namespace: "kastro" }, imageComponent);
    },
  });

  globalThis.GEN = true;
  globalThis.document = {};
  globalThis.document.createElement = (name) => ({
    name
  });
}

/**
 * @param {!Object} crate
 * @param {compiler.BuildMode} buildMode
 * @return {!Object<string, *>} Returns a map from routes to page props.
 */
const cratePageProps = (crate, buildMode) => {
  /** @const {!Array<string>} */
  const langs = crate.Page ? Object.keys(Object.values(crate.Page)[0]) : crate.Languages;
  const map = {};
  const add = (page, name) => {
    for (const lang of langs) {
      const pageProps = {
        BuildMode: buildMode,
        Lang: lang,
        CodebaseLang: crate.CodebaseLang,
        Route: { ...page }, // Make a copy
        bundleName: page[lang],
        targetName: `/build/${name || page[crate.CodebaseLang]}/page-${lang}.html`,
      };
      delete pageProps.Route[lang];
      map[`/${page[lang]}`] = pageProps;
    }
  };
  if (crate.Page)
    for (const [name, routes] of Object.entries(crate.Page))
      add(routes, routes == crate.Entry ? name.toLowerCase() : undefined);
  map["/"] = map[`/${crate.CodebaseLang}`];

  return map;
};

const serveCrate = async (crateName, buildMode) => {
  const crate = await import(crateName);
  const map = cratePageProps(crate, buildMode);
  let currentPageProps;

  createServer({
    appType: "mpa",
    publicDir: buildMode == compiler.BuildMode.Dev ? "" : "build/crate",
    plugins: [{
      name: "kastro-js",

      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.originalUrl in map) {
            res.setHeader("content-type", "text/html;charset=utf-8");
            server.moduleGraph.invalidateAll();
            currentPageProps = map[req.originalUrl];
            compiler.forceBuildTarget(currentPageProps.targetName, currentPageProps)
              .then((content) => res.end(content));
          } else next();
        })
      },

      transform(code, id) {
        const globals = getGlobals();
        if (crate.devModeJsTransform)
          return crate.devModeJsTransform(id, code, globals);
      }
    }]
  }).then((vite) => vite.listen(8787))
    .then(console.log("Dev server running at http://localhost:8787"));
}

setupKastro();
const args = parseArgs(process.argv.slice(2), "target");
serveCrate(process.cwd() + "/crate.js", args["compiled"]
  ? compiler.BuildMode.Compiled
  : compiler.BuildMode.Dev);

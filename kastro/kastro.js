import { plugin } from "bun";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { combine, getDir } from "../util/paths";
import compiler from "./compiler/compiler";
import { inlineSvgTarget, pngTarget, svgTarget } from "./compiler/image";
import { pageTarget } from "./compiler/page";
import { stylesheetTarget } from "./compiler/stylesheet";
import { registerTargetFunction } from "./compiler/targetRegistry";
import { readCrateRecipe } from "./crate";

const setupKastro = () => {
  registerTargetFunction(".html", pageTarget);
  registerTargetFunction(".inl.svg", inlineSvgTarget);
  registerTargetFunction(".png", pngTarget);
  registerTargetFunction(".svg", svgTarget);
  registerTargetFunction(".css", stylesheetTarget);
  // registerTargetFunction(".ttf", ttfTarget);

  plugin({
    name: "kastro-js",
    async setup(build) {
      const cwdLen = process.cwd().length + 1;
      const moduleDir = getDir(import.meta.url.slice(6));
      const stylesheetLoader = await readFile("/" + combine(moduleDir, "./compiler/loader/stylesheetLoader.js"), "utf8");
      const scriptLoader = await readFile("/" + combine(moduleDir, "./compiler/loader/scriptLoader.js"), "utf8");

      build.onLoad({ filter: /\.(svg|png|webp)$/ }, (args) => {
        const code = `import { Image } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => Image({...props, src: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
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
      build.onLoad({ filter: /.*/, namespace: "kastro" }, (args) => ({
        contents: scriptLoader.replace("SOURCE", args.path.slice(cwdLen)),
        loader: "js"
      }));
    },
  });

  globalThis.GEN = true;
  globalThis.document = {};
  globalThis.document.createElement = (name) => ({
    name
  });
}

/**
 * @param {string} crateName
 * @param {compiler.BuildMode} buildMode
 * @return {!Promise<!Object<string, *>>} Returns a map from routes to page globals.
 */
const readCrate = (crateName, buildMode) => readCrateRecipe(crateName)
  .then((crate) => {
    /** @const {!Array<string>} */
    const langs = crate.pages ? Object.keys(crate.pages[0]) : crate.languages;
    const map = {};
    const add = (page) => {
      for (const lang of langs) {
        const pageProps = {
          BuildMode: buildMode,
          Lang: lang,
          CodebaseLang: crate.codebaseLang,
          Route: { ...page } // Make a copy
        };
        delete pageProps.Route[lang];
        map[`/${page[lang]}`] = pageProps;
      }
    };
    add(Object.fromEntries(langs.map(lang => [lang, lang])));
    map["/"] = map[`/${crate.codebaseLang}`];
    if (crate.pages)
      for (const page of crate.pages) add(page);

    return map;
  });

const serveCrate = async (crateName, buildMode) => {
  const map = await readCrate(crateName, buildMode);
  let currentPageProps;

  console.log(map);

  createServer({
    appType: "mpa",
    publicDir: buildMode == compiler.BuildMode.Dev ? "" : "build/",
    plugins: [{
      name: "kastro-js",

      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.originalUrl in map) {
            res.setHeader("content-type", "text/html;charset=utf-8");
            server.moduleGraph.invalidateAll();
            currentPageProps = map[req.originalUrl];
            compiler.forceBuildTarget("/build/ana/sayfa.html", currentPageProps)
              .then((content) => res.end(content));
          } else next();
        })
      },

      transform(code, id) {
        if (id.endsWith("cüzdan/birim.js"))
          return code
            .replace(/const Chains =.*?;/, `const Chains = ${JSON.stringify(currentPageProps.Chains)};`)
            .replace(/const DefaultChain =.*?;/, `const DefaultChain = ${JSON.stringify(currentPageProps.DefaultChain)};`);
        if (id.endsWith("dil/birim.js"))
          return code
            .replace(/const Route =.*?;/, `const Route = ${JSON.stringify(currentPageProps.Route)};`);
        if (id.endsWith("util/dom.js"))
          return code
            .replace(/const GEN =.*?;/, `const GEN = false`)
            .replace(/const Lang =.*?;/, `const Lang = "${currentPageProps.Lang}";`);
        if (id.endsWith(".jsx")) {
          const lines = code.split("\n");
          const filteredLines = lines.filter((line) => line.includes("util/dom") ||
            line.trim().startsWith("export const"));
          return filteredLines.join("\n");
        }
      }
    }]
  }).then((vite) => vite.listen(8787))
    .then(console.log("Dev server running at http://localhost:8787"));
}

setupKastro();
serveCrate(".", compiler.BuildMode.Dev);

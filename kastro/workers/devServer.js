import { createServer } from "vite";
import { parseArgs } from "../../util/cli";
import { BuildMode } from "../compiler/compiler";
import { compilePage, compileSvg } from "../compiler/page";
import { readCrateRecipe } from "../crate";

/**
 * @param {string} crateName
 * @param {BuildMode} buildMode
 * @return {!Promise<!Object<string, *>>} Returns a map from routes to page globals.
 */
const readCrate = (crateName, buildMode) => readCrateRecipe(crateName)
  .then((crate) => {
    /** @const {!Array<string>} */
    const langs = crate.pages ? Object.keys(crate.pages[0]) : crate.languages;
    const map = {};
    const add = (page, rootComponent) => {
      const routes = {};
      for (const routeLang of langs)
        routes[`Route${routeLang.toUpperCase()}`] = page[routeLang];
      for (const lang of langs) {
        const pageData = {
          RootComponent: (crateName === "." ? "" : `${crateName}/`) + (rootComponent || page[crate.codebaseLang]),
          BuildMode: buildMode,
          Lang: lang,
          CodebaseLang: crate.codebaseLang,
        };
        map[`/${page[lang]}`] = Object.assign(pageData, routes);
      }
    };
    add(Object.fromEntries(langs.map(lang => [lang, lang])), crate.index);
    map["/"] = map[`/${crate.codebaseLang}`];
    if (crate.pages)
      for (const page of crate.pages) add(page);

    return map;
  });

/**
 * @param {string} crateName
 * @param {BuildMode} buildMode
 */
const serveCrate = async (crateName, buildMode) => {
  const map = await readCrate(crateName, buildMode);
  console.log(map);
  let currentPage;

  createServer({
    appType: "mpa",
    publicDir: buildMode == BuildMode.Dev ? "" : "build/",
    plugins: [{
      name: "kastro-js",

      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.originalUrl in map) {
            res.setHeader("content-type", "text/html;charset=utf-8");
            server.moduleGraph.invalidateAll();
            currentPage = map[req.originalUrl];
            compilePage(currentPage.RootComponent, currentPage)
              .then((html) => res.end(html));
          } else next();
        })
      },

      transform(code, id) {
        if (id.endsWith("dil/birim.js"))
          return code
            .replace(/const KonumTR =.*?;/, `const KonumTR = "${currentPage.RouteTR}"`)
            .replace(/const KonumEN =.*?;/, `const KonumEN = "${currentPage.RouteEN}"`);
        if (id.endsWith("util/dom.js"))
          return code
            .replace(/const GEN =.*?;/, `const GEN = false`)
            .replace(/const TR =.*?;/, `const TR = ${currentPage.Lang == "tr" ? "true" : "false"}`);
      }
    }]
  }).then((vite) => vite.listen(8787))
    .then(console.log("Dev server running at http://localhost:8787"));
}

const args = parseArgs(process.argv.slice(2), "target");
serveCrate(".", args["compiled"] ? BuildMode.Compiled : BuildMode.Dev);

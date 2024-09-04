import { createServer } from "vite";
import { readCrateRecipe } from "../crate";
import { svgOku, sayfaOku } from "../sayfa/eskiOkuyucu";

/**
 * @param {string} crateName
 * @param {birimler.Crate} crate
 * @return {!Object<string, Object>}
 */
const generateMap = (crateName, crate) => {
  const map = {};
  const ekle = (sayfa, dil, ad) => map[`/${dil == "tr" ? sayfa.tr : sayfa.en}`] = {
    ...sayfa,
    konum: `${crateName}/${ad || sayfa.tr}/sayfa.html`,
    dil,
    dev: true
  };
  map["/"] = ekle({ tr: "tr", en: "en" }, "en", crate.dizin);
  ekle({ tr: "tr", en: "en" }, "tr", crate.dizin);
  if (crate.sayfalar)
    for (const sayfa of crate.sayfalar) {
      ekle(sayfa, "tr");
      ekle(sayfa, "en")
    }
  return map;
}

/**
 * @param {string} crateName
 */
const serveCrate = async (crateName) => {
  const crate = await readCrateRecipe(crateName);
  const map = generateMap(crateName, crate);
  let yollananSayfa;

  createServer({
    appType: "mpa",
    plugins: [{
      name: "kimlikdao-birimler",

      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.endsWith(".m.svg")) {
            res.setHeader("content-type", "image/svg+xml");
            svgOku({
              konum: req.url.slice(1),
              dil: "en",
              dev: true
            }).then((svg) => res.end(svg));
          } else if (req.originalUrl in map) {
            server.moduleGraph.invalidateAll();
            yollananSayfa = map[req.originalUrl];
            res.setHeader("content-type", "text/html;charset=utf-8");
            sayfaOku(yollananSayfa).then((html) => res.end(html));
          } else next();
        })
      },

      transform(code, id) {
        if (id.endsWith("dil/birim.js"))
          return code
            .replace(/const KonumTR =.*?;/, `const KonumTR = "${yollananSayfa.tr}"`)
            .replace(/const KonumEN =.*?;/, `const KonumEN = "${yollananSayfa.en}"`);
        if (id.endsWith("util/dom.js"))
          return code
            .replace(/const TR =.*?;/, `const TR = ${yollananSayfa.dil == "tr" ? "true" : "false"}`);
      }
    }]
  }).then((vite) => vite.listen(8787))
    .then(console.log("Dev server running at http://localhost:8787"));
}

serveCrate(process.argv[2] || ".");

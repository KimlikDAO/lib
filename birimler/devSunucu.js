import express from "express";
import { readFileSync } from "fs";
import { parse } from "toml";
import { createServer } from "vite";
import { sayfaOku } from "./okuyucu";

const KimlikDAOSwcPlugin = {
  name: "vite-plugin-kimlikdao-swc",
  enforce: "pre",
  transform(code, id) {
    if (id.includes(".ts")) {
      id = id.replace(/\/([^\/]+)\.ts/, '/build/$1.js');
      console.log(id);
      return readFileSync(id, "utf8");
    }
    return code;
  }
}

/**
 * @param {{
 *   codebaseLang: string,
 *   port: number,
 *   hostname: (string|undefined),
 *   kök: (string|undefined),
 *   dizin: string,
 *   sayfalar: !Array<!Array<string>>
 * }} seçenekler
 */
const çalıştır = (seçenekler) => createServer({
  server: { middlewareMode: true },
  appType: "custom",
  plugins: [KimlikDAOSwcPlugin],
  esbuild: {
    include: [],
    exclude: ["o1js"]
  }
}).then((vite) => {
  /** @const {string} */
  const sayfaAdı = seçenekler.codebaseLang == "en" ? "/page.html" : "/sayfa.html";
  /** @const {!Object<string, {{ ad: string, dil: string}}>} */
  const harita = {};
  /** @const {string} */
  const kök = seçenekler.kök ? seçenekler.kök + "/" : "";

  harita["/"] = {
    ad: kök + seçenekler.dizin + sayfaAdı,
    dil: "en"
  }

  for (const sayfa of seçenekler.sayfalar) {
    harita[`/${sayfa[0]}`] = {
      ad: kök + sayfa[0] + sayfaAdı,
      dil: "tr"
    }
    harita[`/${sayfa[1]}`] = {
      ad: kök + sayfa[0] + sayfaAdı,
      dil: "en"
    }
  }
  const app = express();
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
  });
  app.get("/*.svg", (req, res) => {
    const sayfaAdı = decodeURIComponent(req.path.slice(1));
    const svg = sayfaOku(sayfaAdı, { dil: "en", dev: true })
    res.status(200).set({ "content-type": "image/svg+xml" }).end(svg);
  })
  app.use(vite.middlewares)
  app.use(Object.keys(harita), (req, res, next) => {
    if (!(req.path in harita)) {
      res.status(200).end(); // Dev sunucuda hata vermemeye çalış
    } else {
      const { ad, dil } = harita[req.path]
      /** @const {string} */
      const sayfa = sayfaOku(ad, {
        dil: "tr" in req.query ? "tr" : "en" in req.query ? "en" : dil,
        dev: true
      });
      vite.transformIndexHtml(req.path, sayfa).then((sayfa) => {
        res.status(200)
          .set({ 'Content-type': 'text/html;charset=utf-8' })
          .end(sayfa);
      }).catch((e) => {
        vite.ssrFixStacktrace(e)
        next(e)
      })
    }
  });
  console.info((seçenekler.codebaseLang == "en"
    ? "Dev server running at: "
    : "Dev sunucu şu adreste çalışıyor: ")
    + `http://localhost:${seçenekler.port}`);
  app.listen(seçenekler.port);
});

if (process.argv[2] == "--çalıştır" || process.argv[2] == "--run")
  çalıştır(parse(readFileSync(process.argv[3])));

export { çalıştır };

import express from "express";
import { readFileSync } from "node:fs";
import { parse } from "toml";

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
const çalıştır = (seçenekler) => {
  /** @const {string} */
  const kök = seçenekler.kök ? `build/${seçenekler.kök}/` : "build/"

  /** @const {!Express} */
  const app = express();

  /** @const {!Object<string, string>} */
  const harita = {};

  harita["/"] = kök + seçenekler.dizin + "-tr.html";

  for (const sayfa of seçenekler.sayfalar) {
    harita["/" + sayfa[0]] = kök + sayfa[0] + "-tr.html";
    harita["/" + sayfa[1]] = kök + sayfa[1] + "-en.html";
  }

  app.use(express.static("build", {
    redirect: false
  }));
  app.use(Object.keys(harita), (req, res) => {
    console.info(req.url);
    res.status(200)
      .set({ "content-type": "text/html;charset=utf-8" })
      .end(readFileSync(harita[req.path]))
  });

  console.log((seçenekler.codebaseLang == "en"
    ? "Canary server running at: "
    : "Kanarya sunucu şu adreste çalışıyor: ")
    + `http://localhost:${seçenekler.port}`);
  app.listen(seçenekler.port);
}

if (process.argv[2] == "--çalıştır" || process.argv[2] == "--run")
  çalıştır(parse(readFileSync(process.argv[3])));

export { çalıştır };

import yaml from "js-yaml";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { Crate } from "../crate.d";
import { sayfaOku } from "../sayfa/okuyucu";

/**
 * @param {Crate} crate
 */
const run = async (crate) => {
  let page = "";

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    plugins: [{
      name: "@define{} substitute",
      transform(code, id) {
        if (id.endsWith("dil/birim.js"))
          return code
            .replace(/const KonumTR =.*?;/, 'const KonumTR = "?tr"')
            .replace(/const KonumTR =.*?;/, 'const KonumTR = "?en"');
      }
    }]
  });

  vite.middlewares.use(async (req, res, next) => {
    if (req.url != "/") {
      next();
      return;
    }
    try {
      const html = sayfaOku("join/sayfa.html", {
        dil: "en",
        dev: true
      });
      res.statusCode = 200;
      res.setHeader("content-type", "text/html;charset=utf-8");
      res.end(await vite.transformIndexHtml(req.url, html, req.originalUrl));
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.statusCode = 500;
      res.end(e.message);
    }
  });
  const port = crate.port || 8787;
  vite.middlewares.listen(port,
    () => console.log(`Server running at http://localhost:${port}`));
}

readFile("join/build.yaml", "utf8")
  .then((crateStr) => run(yaml.load(crateStr)));

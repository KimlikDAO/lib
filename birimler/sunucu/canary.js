import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { readCrateRecipe } from "../crate";
import { Mimes } from "../mimes";

/**
 * @param {string} path
 * @return {string}
 */
const getContentType = (path) => Mimes[path.slice(path.lastIndexOf(".") + 1)];

/**
 * @param {string} crateName
 */
const serveCrate = async (crateName) => {
  /** @const {birimler.Crate} */
  const crate = await readCrateRecipe(crateName);
  crateName = `build/${crateName}`;
  /** @const {number} */
  const port = crate.port || 8787;

  const map = {
    "/": `${crateName}/en.html`
  };
  if (crate.sayfalar)
    for (const page of crate.sayfalar) {
      map[`/${page.tr}`] = `${crateName}/${page.tr}.html`;
      map[`/${page.en}`] = `${crateName}/${page.en}.html`;
    }
  console.log(map);

  serve({
    fetch(req) {
      console.log(req.url);
      const url = new URL(req.url);
      const path = url.pathname;

      if (map[path]) {
        console.info(path);
        return readFile(map[path]).then((res) => new Response(res, {
          headers: {
            "content-type": "text/html;charset=utf-8"
          },
        }))
      }
      return readFile(`build/${path}`).then((res) => new Response(res, {
        headers: {
          "content-type": getContentType(path),
          "cache-control": "max-age=29030400,public,immutable",
          "vary": "accept-encoding"
        }
      }))
    },
    port
  });

  console.log(
    (crate.codebase_lang === "en"
      ? "Canary server running at: "
      : "Kanarya sunucu şu adreste çalışıyor: ") + `http://localhost:${port}`
  );
};

serveCrate(process.argv[2] || ".");

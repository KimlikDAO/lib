import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { readCrateRecipe } from "../crate";
import { Mimes } from "./mimes";

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
    "/en": `${crateName}/en.html`,
  };
  map["/tr"] = map["/"] = `${crateName}/tr.html`;
  if (crate.sayfalar)
    for (const page of crate.sayfalar) {
      map[`/${page.tr}`] = `${crateName}/${page.tr}.html`;
      map[`/${page.en}`] = `${crateName}/${page.en}.html`;
    }
  console.log(map);

  serve({
    fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      let page = map[path]
      if (page) {
        console.info(`Serving page: ${page}`);
        return readFile(page).then((res) => new Response(res, {
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

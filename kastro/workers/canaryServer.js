import { serve } from "bun";
import { readFile } from "node:fs/promises";
import { Mimes } from "./mimes";

/**
 * @param {string} path
 * @return {string}
 */
const getContentType = (path) => {
  const dot = path.slice(path.lastIndexOf(".") + 1);
  return dot == -1 ? null : Mimes[dot]
};

/**
 * @param {string} crateName
 */
const serveCrate = (crateName) => import(crateName).then((crate) => {
  const port = crate.Port || 8787;
  serve({
    fetch(req) {
      let path = new URL(req.url).pathname;
      if (path == "/") path = "/en";
      const contentType = getContentType(path);
      return readFile(`build/crate/${path}`).then((res) => {
        const headers = contentType ? {
          "content-type": contentType,
          "cache-control": "max-age=29030400,public,immutable",
          "vary": "accept-encoding"
        } : {
          "content-type": "text/html;charset=utf-8"
        };
        if (!contentType) console.info(`Serving page: ${path}`);
        return new Response(res, { headers })
      });
    },
    port
  });

  console.log({
    en: "Canary server running at: ",
    tr: "Kanarya sunucu şu adreste çalışıyor: "
  }[crate.CodebaseLang || "en"] + `http://localhost:${port}`);
});

serveCrate((process.argv[2] || "") + "/crate.js");

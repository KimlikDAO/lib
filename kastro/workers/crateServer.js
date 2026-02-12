import { readdir, readFile } from "node:fs/promises";
import { serve, file } from "bun";
import { CompressedMimes, Mimes } from "./mimes";

/** @const {string} */
const STATIC_CACHE_CONTROL = "max-age=29030400,public,immutable,no-transform";
/** @const {string} */
const PAGE_CACHE_CONTROL = "max-age=60,public,no-transform";

/**
 * Reads the crate as Uint8Array's.
 *
 * @param {string} crateName
 * @return {Promise<Object<string, Uint8Array>>}
 */
const loadCrate = (crateName) => readdir(crateName)
  .then((files) => Promise.all(files.map((file) => readFile(crateName + "/" + file)
    .then((content) => [file, content])))
    .then(Object.fromEntries));

loadCrate("./crate").then((files) => serve({
  fetch(req) {
    /** @const {string} */
    const path = new URL(req.url).pathname.slice(1);
    /** @const {number} */
    const dot = path.indexOf(".");
    /** @const {string} */
    const suffix = path.slice(dot + 1);
    /** @const {string} */
    const enc = req.headers.get("accept-encoding") || "";
    /** @const {string} */
    const ext = (dot != -1 && CompressedMimes[suffix])
      ? ""
      : enc.includes("br") ? ".br" : enc.includes("gz") ? ".gzip" : "";

    let resolvedPath = path;
    if (!path) {
      /** @const {?string} */
      const cookie = req.headers.get("cookie")
      /** @const {number} */
      const leq = cookie ? cookie.indexOf("l=") : -1;
      resolvedPath = (leq != -1)
        ? /** @type {string} */(cookie).slice(leq + 2, leq + 4)
        : req.headers.get("accept-language")
          ?.includes("tr")
          ? "tr" : "en"
    }
    /** @const {Uint8Array|undefined} */
    const file = files[resolvedPath + ext.slice(0, 3)];
    if (!file) return Response.redirect("/");
    /** @const {!Object<string, string>} */
    const headers = {
      "cache-control": dot == -1 ? PAGE_CACHE_CONTROL : STATIC_CACHE_CONTROL,
      "cdn-cache-control": STATIC_CACHE_CONTROL,
      "content-type": dot == -1 ? "text/html;charset=utf-8" : Mimes[suffix],
      "content-length": file.byteLength,
      "expires": "Sun, 01 Jan 2034 00:00:00 GMT",
    };
    if (!CompressedMimes[suffix])
      headers["vary"] = path ? "accept-encoding" : "accept-encoding,accept-language,cookie";
    if (ext.length)
      headers["content-encoding"] = ext.slice(1);
    if (suffix == "woff2" || suffix == "ttf")
      headers["access-control-allow-origin"] = "*";
    return new Response(file, { headers });
  },
  tls: {
    key: file("priv.key"),
    cert: file("cert.pem")
  },
  port: 443
}));

import { CompressedMimes, Mimes } from "../workers/mimes";
import { ModuleWorker } from "./moduleWorker.d";
import { CfRequest } from "./types.d";

/** @define {string} */
const HOST_URL = "";
/** @define {Record<string, string>} */
const ETAGS = {};
/** @const {string} */
const PAGE_CACHE_CONTROL = "max-age=100,public,no-transform";
/** @const {string} */
const STATIC_CACHE_CONTROL = "max-age=29000000,public,immutable,no-transform";

/** @const {ModuleWorker} */
const Worker = {
  /**
   * @override
   * @param {CfRequest} req
   * @return {Promise<Response> | Response}
   */
  fetch(req) {
    /** @const {string} */
    const path = new URL(req.url).pathname.slice(1);
    /** @const {number} */
    const dot = path.indexOf(".");
    /** @const {string} */
    const suffix = path.slice(dot + 1);
    /** @const {string} */
    const enc = req.cf.clientAcceptEncoding || "";
    /** @const {string} */
    const ext = (dot != -1 && CompressedMimes[suffix])
      ? ""
      : enc.includes("br") ? ".br" : enc.includes("gz") ? ".gzip" : "";
    /** @type {string} */
    let resolvedPath = path;
    if (!path) {
      /** @const {string | null} */
      const cookie = req.headers.get("cookie")
      /** @const {number} */
      const leq = cookie ? cookie.indexOf("l=") : -1;
      resolvedPath = (leq != -1)
        ? /** @type {string} */(cookie).slice(leq + 2, leq + 4)
        : req.headers.get("accept-language")
          ?.includes("tr") ? "tr" : "en"
    }
    /** @const {string | null} */
    const maybeEtag = ETAGS[resolvedPath];
    if (maybeEtag && req.headers.get("if-none-match") == maybeEtag)
      return new Response(null, { status: 304 });

    return import(resolvedPath + ext.slice(0, 3))
      .then(({ default: file }) => {
        /** @const {Record<string, string | number>} */
        const headers = {
          "cache-control": (dot == -1 || maybeEtag) ? PAGE_CACHE_CONTROL : STATIC_CACHE_CONTROL,
          "content-type": dot == -1 ? "text/html;charset=utf-8" : Mimes[suffix],
          "content-length": file.byteLength,
          "expires": "Sun, 01 Jan 2034 00:00:00 GMT",
          // Technically no vary header is needed for CompressedMimes, but
          // when left empty, Cloudflare inserts "Accept-Encoding"
          // anyway, so we don't distinguish this case.
          "vary": path ? "accept-encoding" : "accept-encoding,cookie"
        };
        if (maybeEtag)
          headers["etag"] = maybeEtag;
        if (ext.length)
          headers["content-encoding"] = ext.slice(1);
        if (suffix == "woff2" || suffix == "ttf")
          headers["access-control-allow-origin"] = "*";
        return new Response(file, { headers, "encodeBody": "manual" });
      })
      .catch(() => Response.redirect(HOST_URL));
  }
}

export default Worker;

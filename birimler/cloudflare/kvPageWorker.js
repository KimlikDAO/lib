import { Env } from "./kvPageWorker.d";
import { ModuleWorker } from "./moduleWorker.d";
import { CfRequest } from "./types.d";

/** @const {!Object<string, string>} */
const MIMES = {
  "css": "text/css",
  "js": "application/javascript;charset=utf-8",
  // Font
  "ttf": "font/ttf",
  "woff2": "font/woff2",
  // Resim ve foto
  "svg": "image/svg+xml",
  "png": "image/png",
  "webp": "image/webp",
  // Metin
  "txt": "text/plain",
};
/** @const {!Object<string, boolean>} */
const COMPRESSED_MIMES = { "woff2": true, "png": true, "webp": true };

/** @const {string} */
const PAGE_CACHE_CONTROL = "max-age=90,public";
/**
 * @const {string}
 * @noinline
 */
const STATIC_CACHE_CONTROL = "max-age=29030400,public,immutable";

/**
 * @return {!Response}
 */
const err = () => new Response("NAPİM?", {
  status: 404,
  headers: { "content-type": "text/plain;charset=utf-8" }
})

/**
 * @param {string} hostUrl
 * @param {!Object<string, string>} pages
 * @return {!ModuleWorker}
 */
const create = (hostUrl, pages) => /** @type {!ModuleWorker} */({
  /**
   * @override
   *
   * @param {!CfRequest} req
   * @param {Env} env
   * @param {!Context} ctx
   * @return {!Promise<!Response>|!Response}
   */
  fetch(req, env, ctx) {
    /** @const {string} */
    const url = req.url;
    /** @const {string} */
    const enc = req.cf.clientAcceptEncoding || "";
    /** @const {number} */
    const idx = url.lastIndexOf(".");
    /** @const {string} */
    const suffix = url.slice(idx + 1);

    /** @const {string} */
    const ext = COMPRESSED_MIMES[suffix]
      ? ""
      : enc.includes("br") ? ".br" : enc.includes("gz") ? ".gz" : "";

    /** @type {?string} */
    let kvKey = url.slice(hostUrl.length);
    /** @type {?string} */
    let cacheKey;
    if (kvKey && idx != hostUrl.lastIndexOf("."))
      cacheKey = url;
    else {
      /** @const {number} */
      const qmark = kvKey.lastIndexOf("?");
      if (qmark != -1 && kvKey.length > 3)
        kvKey = kvKey.slice(0, qmark);
      if (kvKey) kvKey = pages[kvKey];
      else {
        /** @const {?string} */
        const cookie = req.headers.get("cookie");
        kvKey = (cookie ? cookie.includes("l=tr") : req.headers.get("accept-language")?.includes("tr"))
          ? pages["?tr"] : pages["?en"];
      }
      cacheKey = hostUrl + kvKey
    }
    kvKey += ext;
    cacheKey += ext;

    /** @type {boolean} */
    let inCache = false;
    /**
     * We search the CF cache for the asset.
     *
     * @const {!Promise<!Response>}
     */
    const fromCache = caches.default.match(cacheKey).then((response) => {
      if (!response) return Promise.reject();
      inCache = true;
      response = new Response(response.body, {
        headers: response.headers,
        "encodeBody": "manual"
      });
      response.headers.set("content-encoding",
        response.headers.get("content-encoding").slice(1));
      if (idx == hostUrl.lastIndexOf("."))
        response.headers.set("cache-control", PAGE_CACHE_CONTROL);
      return response;
    });

    /**
     * @param {!ArrayBuffer} body
     * @param {string} toCache
     * @return {!Response}
     */
    const makeResponse = (body, toCache) => {
      /** @type {!Object<string, string>} */
      let headers = {
        "cache-control": (toCache || idx != hostUrl.lastIndexOf("."))
          ? STATIC_CACHE_CONTROL
          : PAGE_CACHE_CONTROL,
        "content-encoding": toCache + (ext === ".br" ? "br" : ext === ".gz" ? "gzip" : ""),
        "content-length": body.byteLength,
        "content-type": idx == hostUrl.lastIndexOf(".")
          ? "text/html;charset=utf-8"
          : MIMES[suffix],
        "expires": "Sun, 01 Jan 2034 00:00:00 GMT",
        "vary": "accept-encoding",
      }
      if (suffix == "woff2" || suffix == "ttf")
        headers["access-control-allow-origin"] = "*";
      return new Response(body, {
        headers,
        "encodeBody": "manual"
      });
    }

    /**
     * In parallel, we also query the CF KV. Under normal circumstances, if
     * the asset is present in the CF cache, `fromCache` promise should always
     * win the race.
     * If the asset has been evicted from CF cache, this promise will get it
     * from KV and write it to CF cache (after a small header modification).
     * If the asset is present in CF cache and the cache returns in a timely
     * manner, this promise will not re-write to CF cache, as the `fromCache`
     * promise will set the `inCache` flag, which prevents this promise from
     * recaching the response.
     * In all other cases (either the response is not present in CF cache or
     * CF cache is taking unusually long), the response will be served from the
     * KV.
     *
     * @const {!Promise<!Response>}
     */
    const fromKV = env.KV.get(kvKey, "arrayBuffer").then((body) => {
      if (!body) return Promise.reject();
      // Remember to cache the response, but only after we finish serving the
      // request.
      ctx.waitUntil(new Promise((/** function(?):void */ resolve) =>
        resolve(inCache ? null : caches.default.put(/** @type {string} */(cacheKey),
          makeResponse(/** @type {!ArrayBuffer} */(body), "Y")))
      ));
      return makeResponse(body, "");
    })

    return Promise.any([fromCache, fromKV]).catch(err);
  }
});

export { create, err };

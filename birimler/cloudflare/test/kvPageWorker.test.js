import { expect, it } from "bun:test";
import { create } from "../kvPageWorker";
import { KvPageWorkerEnv } from "../kvPageWorker.d";
import { MockKeyValue } from "../mock/keyValue";
import { Context, ModuleWorker } from "../moduleWorker.d";
import { CfRequest } from "../types.d";

globalThis["caches"] = {};
globalThis["caches"]["default"] = /** @type {!Cache} */({
  /**
   * @param {string} key
   * @return {!Promise<Response>}
   */
  match(key) {
    return Promise.resolve(null);
  },

  /**
   * @param {string} key
   * @param {!Response} res
   */
  put(key, res) { return Promise.resolve(); },
});

/** @const {KvPageWorkerEnv} */
const env = /** @type {KvPageWorkerEnv} */({
  KV: new MockKeyValue()
});

/** @const {!Context} */
const ctx = /** @type {!Context} */({
  /**
   * @param {!Promise<*>} promise
   */
  waitUntil(promise) { }
})

/**
 * @param {string} url
 * @param {string} encoding
 * @param {string} cookie
 * @return {!CfRequest}
 */
const createRequest = (url, encoding, cookie) => /** @type {!CfRequest} */({
  url,
  headers: {
    /**
     * @param {string} key
     * @return {?string}
     */
    get(key) { return key.toLowerCase() == "cookie" ? cookie : ""; }
  },
  cf: {
    clientAcceptEncoding: encoding
  }
});

/** @const {!ModuleWorker} */
const KvPageWorker = create("https://kimlikdao.org/");

const testKvName = (url, acceptEncoding, cookie, kvName) => it(
  `returns the correct result for ${acceptEncoding}, ${cookie}, ${kvName}`,
  () => /** @type {!Promise<Response>} */(
    KvPageWorker.fetch(
      createRequest(url, acceptEncoding, cookie), env, ctx))
    .then((res) => res.text())
    .then((res) => expect(res).toBe(kvName))
);

testKvName("https://kimlikdao.org/?tr", "gzip", "l=en", "?tr.gz");
testKvName("https://kimlikdao.org/?tr", "gzip", "l=en", "?tr.gz");
testKvName("https://kimlikdao.org/vote", "gzip", "l=tr", "vote.gz");
testKvName("https://kimlikdao.org/", "br", "l=tr", "?tr.br");
testKvName("https://kimlikdao.org/", "br", null, "?en.br");
testKvName("https://kimlikdao.org/vote?evil_tracker=...dot.", "br", "l=tr", "vote.br");
testKvName("https://kimlikdao.org/?utm_source=Wallet", "br, gzip", null, "?en.br");
testKvName("https://kimlikdao.org/vote", "br", null, "vote.br");
testKvName("https://kimlikdao.org/?utm", "gzip, br", "l=tr", "?tr.br");
testKvName("https://kimlikdao.org/abc.woff2", "br", null, "abc.woff2");
testKvName("https://kimlikdao.org/vote/", "gzip", "l=tr", "vote.gz");

testKvName("https://kimlikdao.org//", "gzip", "l=tr", "?tr.gz");
testKvName("https://kimlikdao.org/?en/", "gzip", "l=tr", "?tr.gz");
testKvName("https://kimlikdao.org//?en", "gzip", "l=tr", "?tr.gz");

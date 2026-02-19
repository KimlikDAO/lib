/**
 * @fileoverview Externs for Cloudflare Module Workers.
 *
 * @author KimlikDAO
 */

import "./cache.d";
import { CfRequest } from "./types.d";

/**
 * @interface
 */
function Context() { }

/**
 * @param {Promise<unknown>} promise
 */
Context.prototype.waitUntil = function (promise) { }

/**
 * @typedef {{
 *   fetch: (req: CfRequest, opt?: any, ctx?: Context) => Promise<Response> | Response
 * }}
 */
const ModuleWorker = {};

/**
 * @interface
 */
function ModuleWorkerStub() { }

/**
 * A module worker stub has the same fetch interface as the web api fetch.
 *
 * @param {RequestInfo} input
 * @param {RequestInit=} init
 * @return {Promise<Response>}
 * @see https://fetch.spec.whatwg.org/#fetch-method
 * @see https://developers.cloudflare.com/workers/runtime-apis/fetch/
 */
ModuleWorkerStub.prototype.fetch = function (input, init) { }

export {
  Context,
  ModuleWorker,
  ModuleWorkerStub
};

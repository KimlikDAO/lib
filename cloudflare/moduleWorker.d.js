/**
 * @fileoverview Externs for Cloudflare Module Workers.
 *
 * @author KimlikDAO
 * @externs
 */

/**
 * @interface
 */
cloudflare.Context = function () { }

/**
 * @param {!Promise<*>} promise
 */
cloudflare.Context.prototype.waitUntil = function (promise) { }

/**
 * @interface
 */
cloudflare.ModuleWorker = function () { }

/**
 * @param {!cloudflare.Request} req
 * @param {!cloudflare.Environment=} env
 * @param {!cloudflare.Context=} ctx
 * @return {!Promise<!Response>|!Response}
 */
cloudflare.ModuleWorker.prototype.fetch = function (req, env, ctx) { }

/**
 * @interface
 */
cloudflare.ModuleWorkerStub = function () { }

/**
 * A module worker stub has the same fetch interface as the web api fetch.
 *
 * @param {!RequestInfo} input
 * @param {!RequestInit=} init
 * @return {!Promise<!Response>}
 * @see https://fetch.spec.whatwg.org/#fetch-method
 * @see https://developers.cloudflare.com/workers/runtime-apis/fetch/
 */
cloudflare.ModuleWorkerStub.prototype.fetch = function (input, init) { }

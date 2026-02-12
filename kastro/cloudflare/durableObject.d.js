/**
 * @fileoverview Cloudflare Durable Object definitions.
 *
 * @author KimlikDAO
 */

import cloudflare from "./cloudflare.d";

/**
 * A state of the DurableObject.
 *
 * @interface
 */
cloudflare.DurableObjectState = function () { }

/**
 * @template T
 * @param {function():Promise<T>} callback
 * @return {Promise<T>}
 */
cloudflare.DurableObjectState.prototype.blockConcurrencyWhile = function (callback) { }

/** @const {!cloudflare.DurableObjectStorage} */
cloudflare.DurableObjectState.prototype.storage;

/** @const {!cloudflare.DurableObjectId} */
cloudflare.DurableObjectState.prototype.id;

/**
 * Transactional storage of the durable object.
 *
 * @interface
 */
cloudflare.DurableObjectStorage = function () { }

/**
 * @nosideeffects
 * @param {string|string[]} key
 * @return {Promise<?>}
 */
cloudflare.DurableObjectStorage.prototype.get = function (key) { };

/**
 * @nosideeffects
 * @param {string|!Object<string, *>} key
 * @param {*=} val
 * @return {Promise<void>}
 */
cloudflare.DurableObjectStorage.prototype.put = function (key, val) { };

/**
 * @nosideeffects
 * @param {string} key
 * @return {Promise<boolean>}
 */
cloudflare.DurableObjectStorage.prototype.delete = function (key) { };

/**
 * @nosideeffects
 * @return {Promise<?number>}
 */
cloudflare.DurableObjectStorage.prototype.getAlarm = function () { };

/**
 * @param {number|Date} scheduledTime
 * @return {Promise<void>}
 */
cloudflare.DurableObjectStorage.prototype.setAlarm = function (scheduledTime) { };

/**
 * @typedef {{
*   locationHint: string
* }}
*/
cloudflare.DurableObjectStubOptions;

/**
* @interface
*/
cloudflare.DurableObjectStub = function () { }

/**
* A durable object stub has the same fetch interface as the web api fetch.
*
* @param {!RequestInfo} input
* @param {!RequestInit=} init
* @return {Promise<!Response>}
* @see https://fetch.spec.whatwg.org/#fetch-method
* @see https://developers.cloudflare.com/workers/runtime-apis/fetch/
*/
cloudflare.DurableObjectStub.prototype.fetch = function (input, init) { }

/**
* @nosideeffects
* @param {!cloudflare.DurableObjectId} durableObjectId
* @param {!cloudflare.DurableObjectStubOptions=} options
* @return {!cloudflare.DurableObjectStub}
*/
cloudflare.DurableObjectBinding.prototype.get = function (durableObjectId, options) { }

/**
 * @interface
 */
cloudflare.DurableObject = function (state, env) { }

/**
 * @param {!Request} req
 * @return {Promise<!Response>}
 */
cloudflare.DurableObject.prototype.fetch = function (req) { }

/**
 * @interface
 */
cloudflare.DurableObjectId = function () { }

/**
 * @nosideeffects
 * @return {string}
 */
cloudflare.DurableObjectId.prototype.toString = function () { }

/**
 * @nosideeffects
 * @return {boolean}
 */
cloudflare.DurableObjectId.prototype.equals = function () { }

/**
 * Called `DurableObjectNamespace` in `@cloudflare/workers-types`.
 *
 * @interface
 */
cloudflare.DurableObjectBinding = function () { }

/**
 * @nosideeffects
 * @param {string} name
 * @return {!cloudflare.DurableObjectId}
 */
cloudflare.DurableObjectBinding.prototype.idFromName = function (name) { }

/**
 * @nosideeffects
 * @param {string} hexId
 * @return {!cloudflare.DurableObjectId}
 */
cloudflare.DurableObjectBinding.prototype.idFromString = function (hexId) { }

/**
 * @nosideeffects
 * @return {!cloudflare.DurableObjectId}
 */
cloudflare.DurableObjectBinding.prototype.newUniqueId = function () { }

/**
 * This is for the RPC interface and the realted import
 * ```
 * import {DurableObject} from "cloudflare:workers"
 * ```
 *
 * @constructor
 * @implements {cloudflare.DurableObject}
 *
 * @param {!cloudflare.DurableObjectState} state
 * @param {!cloudflare.Environment} env
 */
const DurableObject = function (state, env) { }

/**
 * @fileoverview Cloudflare workers environment types and definitions.
 *
 * @author KimlikDAO
 * @externs
 */

/**
 * @const
 */
const cloudflare = {};

/**
 * @constructor
 * @extends {Request}
 */
cloudflare.Request = function () { }

/**
 * @const {{
 *   clientAcceptEncoding: ?string
 * }}
 */
cloudflare.Request.prototype.cf;

/**
 * The Cloudflare Response object contains this convenience method.
 *
 * @nosideeffects
 * @param {!Object|!Array|number} jsonObj
 * @param {!Object=} options
 * @return {!Response}
 */
Response.json = function (jsonObj, options) { }

/**
 * This method is only available in web workers so we define it here.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FormData/values
 *
 * @nosideeffects
 * @return {!Iterator<!Blob>}
 */
FormData.prototype.values = function () { }

/**
 * @interface
 */
cloudflare.KeyValue = function () { }

/**
 * @nosideeffects
 * @param {string} key
 * @param {string=} type
 * @return {!Promise<ArrayBuffer>}
 */
cloudflare.KeyValue.prototype.get = function (key, type) { }

/**
 * @param {string} key
 * @param {string|!ArrayBuffer} value
 * @param {{
 *   metadata: *
 * }=} options
 * @return {!Promise<void>}
 */
cloudflare.KeyValue.prototype.put = function (key, value, options) { }

/**
 * @param {string} key
 * @return {!Promise<void>}
 */
cloudflare.KeyValue.prototype.delete = function (key) { }

/**
 * @typedef {{
 *   keys: !Array<{
 *     name: string,
 *     metadata: *
 *   }>,
 *   list_complete: boolean,
 *   cursor: string,
 * }}
 */
cloudflare.KeyValueList = {};

/**
 * @nosideeffects
 * @return {!Promise<!cloudflare.KeyValueList>}
 */
cloudflare.KeyValue.prototype.list = function () { }

/**
 * @const
 */
const caches = {};

/**
 * @interface
 */
cloudflare.Environment = function () { }

/** @const {!Cache} */
caches.default;

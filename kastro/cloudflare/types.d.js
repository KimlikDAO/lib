/**
 * @fileoverview Cloudflare workers environment types and definitions.
 *
 * @author KimlikDAO
 */

/**
 * @constructor
 * @extends {Request}
 */
function CfRequest() { }

/**
 * @const {{
 *   clientAcceptEncoding: string | null
 * }}
 */
CfRequest.prototype.cf;

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
 * @return {Iterator<Blob>}
 */
FormData.prototype.values = function () { }

/**
 * @interface
 */
function KeyValue() { }

/**
 * @nosideeffects
 * @param {string} key
 * @param {string=} type
 * @return {Promise<ArrayBuffer>}
 */
KeyValue.prototype.get = function (key, type) { }

/**
 * @param {string} key
 * @param {string | ArrayBuffer} value
 * @param {{
 *   metadata: unknown
 * }=} options
 * @return {Promise<void>}
 */
KeyValue.prototype.put = function (key, value, options) { }

/**
 * @param {string} key
 * @return {Promise<void>}
 */
KeyValue.prototype.delete = function (key) { }

/**
 * @typedef {{
 *   keys: {
 *     name: string,
 *     metadata: unknown
 *   }[],
 *   list_complete: boolean,
 *   cursor: string
 * }}
 */
const KeyValueList = {};

/**
 * @nosideeffects
 * @return {Promise<KeyValueList>}
 */
KeyValue.prototype.list = function () { }

export { CfRequest, KeyValue, KeyValueList };

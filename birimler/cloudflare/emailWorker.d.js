/**
 * @fileoverview Cloudflare email workers definitions.
 *
 * @author KimlikDAO
 * @externs
 */

import cloudflare from "./cloudflare.d";

/**
 * @interface
 * @struct
 */
cloudflare.EmailMessage = function () { }

/** @const {string} */
cloudflare.EmailMessage.prototype.from;

/** @const {string} */
cloudflare.EmailMessage.prototype.to;

/** @const {Headers} */
cloudflare.EmailMessage.prototype.headers;

/** @const {!ReadableStream} */
cloudflare.EmailMessage.prototype.raw;

/** @const {number} */
cloudflare.EmailMessage.prototype.rawSize;

/**
 * @param {string} rcptTo Verified destination address
 * @param {Headers=} headers
 * @return {!Promise<void>}
 */
cloudflare.EmailMessage.prototype.forward = function (rcptTo, headers) { };

/**
 * @param {string} reason
 */
cloudflare.EmailMessage.prototype.setReject = function (reason) { };

/**
 * @interface
 */
cloudflare.EmailWorker = function () { };

/**
 * @param {!cloudflare.EmailMessage} message
 * @param {!cloudflare.Environment=} env
 * @param {!cloudflare.Context=} ctx
 * @return {!Promise<void>|void}
 */
cloudflare.EmailWorker.prototype.email = function (message, env, ctx) { }

/** @externs */

/**
 * @constructor
 * @struct
 * @param {{
 *   network: string
 * }} params
 */
function Client(params) { }

/** @const */
const minaSigner = {};

/**
 * @typedef {{
 *   field: string,
 *   scalar: string
 * }}
 */
minaSigner.Signature;

/**
 * @typedef {{
 *   signature: minaSigner.Signature,
 *   data: string,
 *   publicKey: string
 * }}
 */
minaSigner.SignedMessage;

/**
 * @param {string} message
 * @param {string} privKey
 * @return {minaSigner.SignedMessage}
 */
Client.prototype.signMessage = function (message, privKey) { }

/**
 * @param {minaSigner.SignedMessage} signedMessage
 * @return {boolean}
*/
Client.prototype.verifyMessage = function (signedMessage) { }

/**
 * @param {string} privKey
 * @return {string}
*/
Client.prototype.derivePublicKey = function (privKey) { }

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
 * @typedef {{
 *   signature: string,
 *   publicKey: string,
 *   data: bigint[]
 * }}
 */
minaSigner.SignedFields;

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
 * @param {bigint[]} fields
 * @param {string} privKey
 * @return {minaSigner.SignedFields}
 */
Client.prototype.signFields = function (fields, privKey) { }

/**
 * @param {minaSigner.SignedFields} signedFields
 * @return {boolean}
 */
Client.prototype.verifyFields = function (signedFields) { }

/**
 * @param {string} privKey
 * @return {string}
*/
Client.prototype.derivePublicKey = function (privKey) { }

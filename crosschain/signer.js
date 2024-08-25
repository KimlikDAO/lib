import eth from "../ethereum/eth.d";
import mina from "../mina/mina.d";

/**
 * @interface
 * @struct
 */
function Signer() { }

/**
 * If the signer is not deterministic, this should throw always.
 *
 * @param {string} message
 * @param {string} address
 * @return {!Promise<!ArrayBuffer>} an array buffer of length 32, which is the secret
 */
Signer.prototype.deriveSecret = (message, address) => { }

/** @typedef {mina.SignerSignature|eth.CompactSignature} */
const Signature = {};

/**
 * @param {string} message
 * @param {string} address
 * @return {!Promise<Signature>}
 */
Signer.prototype.signMessage = (message, address) => { }

export { Signature, Signer };

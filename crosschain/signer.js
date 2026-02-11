import eth from "../ethereum/eth.d";
import mina from "../mina/mina.d";

/** @typedef {mina.SignerSignature|eth.CompactSignature} */
const Signature = {};

/**
 * @interface
 */
class Signer {
  /**
   * @param {string} message
   * @param {string} address
   * @return {Promise<ArrayBuffer>} an array buffer of length 32, which is the secret
   */
  deriveSecret(message, address) { }

  /**
   * @param {string} message
   * @param {string} address
   * @return {Promise<Signature>}
   */
  signMessage(message, address) { }
}

export { Signature, Signer };

import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";

/** @typedef {MinaSignature | EthereumSignature} */
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

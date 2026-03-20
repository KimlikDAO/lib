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
 * This corresponds to SignedLegacy<string> in mina-signer.ts.
 * Due to this, the signature is json encoded, corresponding to `SignatureJson`
 * in `mina/signer/src/types.ts`
 *
 * @typedef {{
 *   signature: minaSigner.Signature,
 *   publicKey: string,
 *   data: string
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

class Client {
  /**
   * @param {{ network: string }} params
   */
  constructor(params) { }
  /**
   * @param {string} message
   * @param {string} privKey
   * @return {minaSigner.SignedMessage}
   */
  signMessage(message, privKey) { }
  /**
   * @param {minaSigner.SignedMessage} signedMessage
   * @return {boolean}
   */
  verifyMessage(signedMessage) { }
  /**
   * @param {bigint[]} fields
   * @param {string} privKey
   * @return {minaSigner.SignedFields}
   */
  signFields(fields, privKey) { }
  /**
   * @param {minaSigner.SignedFields} signedFields
   * @return {boolean}
   */
  verifyFields(signedFields) { }
  /**
   * @param {string} privKey
   * @return {string}
   */
  derivePublicKey(privKey) { }
}

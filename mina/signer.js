import {
  G,
  Point,
  pointFrom,
  signFields as signFieldsUnpacked,
  signMessage as signMessageUnpacked,
  verifyFields as verifyFieldsUnpacked,
  verifyMessage as verifyMessageUnpacked
} from "../crypto/minaSchnorr";
import { PublicKey, Signature } from "./mina";
import { SignerSignature } from "./signature.d";

/**
 * @param {Point} X
 * @return {PublicKey}
 */
PublicKey.fromPoint = (X) => new PublicKey(X.x, !!(X.y & 1n));

/** @return {Point} */
PublicKey.prototype.toPoint = function () {
  // Public keys are always assumed to be valid point on the curve.
  return /** @type {Point} */(pointFrom(this.x, this.isOdd));
}

/**
 * @param {bigint[]} fields
 * @param {bigint} privKey
 * @return {SignerSignature}
 */
const signFields = (fields, privKey) => {
  /** @const {Point} */
  const X = G.copy().multiply(privKey).project();
  const { r, s } = signFieldsUnpacked(fields, privKey, X);
  return /** @type {SignerSignature} */({
    signer: PublicKey.fromPoint(X).toBase58(),
    signature: new Signature(r, s).toBase58()
  });
}

/**
 * @param {bigint[]} fields
 * @param {SignerSignature} sig
 * @return {boolean}
 */
const verifyFields = (fields, sig) => {
  const { r, s } = Signature.fromBase58(sig.signature);
  /** @const {Point} */
  const X = PublicKey.fromBase58(sig.signer).toPoint();
  return verifyFieldsUnpacked(fields, r, s, X);
}

/**
 * @param {string} message
 * @param {bigint} privKey
 * @return {SignerSignature}
 */
const signMessage = (message, privKey) => {
  /** @const {Point} */
  const X = G.copy().multiply(privKey).project();
  const { r, s } = signMessageUnpacked(message, privKey, X);
  return /** @type {SignerSignature} */({
    signer: PublicKey.fromPoint(X).toBase58(),
    signature: new Signature(r, s).toBase58()
  });
}

/**
 * @param {string} message
 * @param {SignerSignature} sig
 * @return {boolean}
 */
const verifyMessage = (message, sig) => {
  const { r, s } = Signature.fromBase58(sig.signature);
  /** @const {Point} */
  const X = PublicKey.fromBase58(sig.signer).toPoint();
  return verifyMessageUnpacked(message, r, s, X);
}

export {
  signFields,
  signMessage,
  verifyFields,
  verifyMessage
};

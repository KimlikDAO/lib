import {
  G,
  Point,
  pointFrom,
  signFields as signFieldsBigInt,
  signMessage as signMessageBigInt,
  verifyFields as verifyFieldsBigInt,
  verifyMessage as verifyMessageBigInt
} from "../crypto/minaSchnorr";
import { PublicKey, Signature } from "./mina";
import mina from "./mina.d";

/**
 * @param {!Point} X
 * @return {!PublicKey}
 */
PublicKey.fromPoint = (X) => new PublicKey(X.x, !!(X.y & 1n));

/** @return {!Point} */
PublicKey.prototype.toPoint = function () {
  // Public keys are always assumed to be valid point on the curve.
  return /** @type {!Point} */(pointFrom(this.x, this.isOdd));
}

/**
 * @param {!Array<bigint>} fields
 * @param {bigint} privKey
 * @return {mina.SignerSignature}
 */
const signFields = (fields, privKey) => {
  /** @const {!Point} */
  const X = G.copy().multiply(privKey).project();
  const { r, s } = signFieldsBigInt(fields, privKey, X);
  return /** @type {mina.SignerSignature} */({
    signer: PublicKey.fromPoint(X).toBase58(),
    signature: new Signature(r, s).toBase58()
  });
}

/**
 * @param {!Array<bigint>} fields
 * @param {mina.SignerSignature} sig
 * @return {boolean}
 */
const verifyFields = (fields, sig) => {
  const { r, s } = Signature.fromBase58(sig.signature);
  /** @const {!Point} */
  const X = PublicKey.fromBase58(sig.signer).toPoint();
  return verifyFieldsBigInt(fields, r, s, X);
}

/**
 * @param {string} message
 * @param {bigint} privKey
 * @return {mina.SignerSignature}
 */
const signMessage = (message, privKey) => {
  /** @const {!Point} */
  const X = G.copy().multiply(privKey).project();
  const { r, s } = signMessageBigInt(message, privKey, X);
  return /** @type {mina.SignerSignature} */({
    signer: PublicKey.fromPoint(X).toBase58(),
    signature: new Signature(r, s).toBase58()
  });
}

/**
 * @param {string} message
 * @param {mina.SignerSignature} sig
 * @return {boolean}
 */
const verifyMessage = (message, sig) => {
  const { r, s } = Signature.fromBase58(sig.signature);
  /** @const {!Point} */
  const X = PublicKey.fromBase58(sig.signer).toPoint();
  return verifyMessageBigInt(message, r, s, X);
}

export {
  signFields,
  signMessage,
  verifyFields,
  verifyMessage
};

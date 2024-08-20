import {
  G,
  Point,
  pointFrom,
  signFields as signFieldsBigInt,
  verifyFields as verifyFieldsBigInt
} from "../crypto/minaSchnorr";
import { IC, f as sha256F } from "../crypto/sha2";
import base58 from "../util/base58";
import { uint8ArrayLEtoBigInt, uint8ArrayLEyeSayıdan } from "../util/çevir";
import "./mina.d";

/**
 * @constructor
 * @struct
 * @param {bigint} x
 * @param {boolean} isOdd
 */
const PublicKey = function (x, isOdd) {
  /** @const {bigint} */
  this.x = x;
  /** @const {boolean} */
  this.isOdd = isOdd;
}

/**
 * @param {string} addr
 * @return {!PublicKey}
 */
PublicKey.fromBase58 = (addr) => {
  /** @const {!Uint8Array} */
  const bytes = base58.toBytes(addr);
  return new PublicKey(uint8ArrayLEtoBigInt(bytes.subarray(3, 35)), !!bytes[35]);
}

/**
 * @param {!Point} X
 * @return {!PublicKey}
 */
PublicKey.fromPoint = (X) => new PublicKey(X.x, !!(X.y & 1n));

/** @return {string} */
PublicKey.prototype.toBase58 = function () {
  /** @const {!Uint8Array} */
  const buff = new Uint8Array(40);
  buff[0] = 203;
  buff[1] = buff[2] = 1;
  buff[35] = +this.isOdd;
  uint8ArrayLEyeSayıdan(buff.subarray(3), this.x);
  addChecksum(buff);
  return base58.from(buff);
}

/** @return {!Point} */
PublicKey.prototype.toPoint = function () {
  // Public keys are always assumed to be valid point on the curve.
  return /** @type {!Point} */(pointFrom(this.x, this.isOdd));
}

/**
 * @param {!Uint8Array} bytes
 * @return {!PublicKey}
 */
PublicKey.fromBytes = (bytes) =>
  new PublicKey(uint8ArrayLEtoBigInt(bytes.subarray(0, 32)), !!bytes[32]);

/**
 * @param {!Uint8Array} buff a buffer of length at least 33
 */
PublicKey.prototype.serializeInto = function (buff) {
  uint8ArrayLEyeSayıdan(buff, this.x);
  buff[32] = +this.isOdd;
}

/**
 * @param {string} privateKey
 * @return {bigint}
 */
const parsePrivateKey = (privateKey) =>
  uint8ArrayLEtoBigInt(base58.toBytes(privateKey).subarray(2, 34));

/**
 * @constructor
 * @struct
 * @param {bigint} r
 * @param {bigint} s
 */
function Signature(r, s) {
  /** @const {bigint} */
  this.r = r;
  /** @const {bigint} */
  this.s = s;
}

/**
 * @param {string} sig
 * @return {!Signature}
 */
Signature.fromBase58 = function (sig) {
  /** @const {!Uint8Array} */
  const bytes = base58.toBytes(sig);
  return new Signature(
    uint8ArrayLEtoBigInt(bytes.subarray(2, 34)),
    uint8ArrayLEtoBigInt(bytes.subarray(34, 66))
  );
}

/** @return {string} */
Signature.prototype.toBase58 = function () {
  /** @const {!Uint8Array} */
  const buff = new Uint8Array(70);
  buff[0] = 154;
  buff[1] = 1;
  uint8ArrayLEyeSayıdan(buff.subarray(2), this.r);
  uint8ArrayLEyeSayıdan(buff.subarray(34), this.s);
  addChecksum(buff);
  return base58.from(buff);
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
 * @param {!Uint8Array} buff bytes array of which the last 4 bytes will be
 *                           written the checksum
 */
const addChecksum = (buff) => {
  /** @const {number} */
  const n = buff.length - 4;
  /** @const {!Uint32Array} */
  const s = new Uint32Array(IC);
  /** @const {!Uint32Array} */
  const t = new Uint32Array(64);
  buff[n] = 128;
  /** @type {number} */
  let j = 0;
  for (let end = n + 3, i = 0; i < end; i += 4) {
    t[j] = (buff[i + 0] << 24) | (buff[i + 1] << 16) | (buff[i + 2] << 8) | buff[i + 3];
    if (j > 14) {
      sha256F(s, t);
      j = 0;
    } else ++j;
  }
  t.fill(0, j, 15);
  t[15] = n << 3;
  sha256F(s, t);
  t.set(s);
  t.fill(0, 9, 15);
  t[8] = 1 << 31;
  t[15] = 256;
  s.set(IC);
  sha256F(s, t);
  const /** number */ v = s[0];
  buff[n + 3] = v & 255;
  buff[n + 2] = (v >> 8) & 255;
  buff[n + 1] = (v >> 16) & 255;
  buff[n + 0] = (v >> 24) & 255;
}

export {
  PublicKey,
  Signature,
  parsePrivateKey,
  signFields,
  verifyFields,
};

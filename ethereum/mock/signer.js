import { Signer } from "../../crosschain/signer";
import { inverse } from "../../crypto/modular";
import { G, Point, Q } from "../../crypto/secp256k1";
import { keccak256Uint32, keccak256Uint32ToHex } from "../../crypto/sha3";
import { hex, hexten, uint8ArrayBEyeSayıdan } from "../../util/çevir";
import evm from "../evm";

/**
 * @param {bigint} privKey
 * @return {string}
 */
const addr = (privKey) => {
  const { x, y } = G.copy().multiply(privKey).project();
  /** @const {!Uint8Array} */
  const buff = hexten(evm.uint256(x) + evm.uint256(y));
  return "0x" + hex(new Uint8Array(
    keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 12, 20));
}

/**
 * Deterministically sign a given `digest` with the `privKey`.
 *
 * Note that derivation of the `K` point is deterministic but non-standard, so
 * the created signature will not match that of the common ethereum wallets.
 *
 * TODO(KimlikDAO-bot): Implement standard deterministic signatures.
 *
 * @param {bigint} digest
 * @param {bigint} privKey
 * @return {{
*   r: bigint,
*   s: bigint,
*   yParity: boolean
* }}
*/
const sign = (digest, privKey) => {
  /** @type {!Uint8Array} */
  const bytes = new Uint8Array(64);
  uint8ArrayBEyeSayıdan(bytes, 32, digest);
  uint8ArrayBEyeSayıdan(bytes, 64, privKey);
  /** @const {!Uint32Array} */
  const buff = new Uint32Array(bytes.buffer);

  for (; ; ++buff[0]) {
    /** @const {bigint} */
    const k = BigInt("0x" + keccak256Uint32ToHex(buff));
    if (k <= 0 || Q <= k) continue; // probability ~2^{-128}, i.e., a near impossibility.
    /** @type {!Point} */
    const K = G.copy().multiply(k).project();
    /** @const {bigint} */
    const r = K.x;
    if (r >= Q) continue; // probability ~2^{-128}, i.e., a near impossibility.
    /** @type {bigint} */
    let s = (inverse(k, Q) * ((digest + r * privKey) % Q)) % Q;
    if (s == 0n) continue; // probability ~2^{-256}
    /** @type {boolean} */
    let yParity = !!(K.y & 1n);
    if (s > (Q >> 1n)) {
      s = Q - s;
      yParity = !yParity;
    }
    return { r, s, yParity }
  }
}

/**
 * @param {{
 *   r: bigint,
 *   s: bigint,
 *   yParity: boolean
 * }} sig
 * @return {eth.WideSignature}
 */
const toWideSignature = (sig) =>
  evm.uint256(sig.r) + evm.uint256(sig.s) + (27 + +sig.yParity).toString(16);

/**
* @param {{
*   r: bigint,
*   s: bigint,
*   yParity: boolean
* }} sig
* @return {eth.CompactSignature}
*/
const toCompactSignature = (sig) => evm.uint256(sig.r) +
  evm.uint256(sig.yParity ? sig.s + (1n << 255n) : sig.s);

/**
 * @param {bigint} digest as bigint
 * @param {bigint} privKey as bigint
 * @return {eth.WideSignature}
 */
const signWide = (digest, privKey) => toWideSignature(sign(digest, privKey));

/**
 * @param {bigint} digest as bigint
 * @param {bigint} privKey as bigint
 * @return {eth.CompactSignature}
 */
const signCompact = (digest, privKey) => toCompactSignature(sign(digest, privKey));

/**
 * @implements {Signer}
 */
class MockSigner {
  /** @param {bigint} privKey */
  constructor(privKey) {
    /** @const {bigint} */
    this.privKey = privKey;
  }

  /**
   * Returns a deterministic but non RFC-6979 compliant signature if the
   * provided address is the signer's address; returns `Promise.reject()`
   * otherwise.
   *
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<eth.CompactSignature>}
   */
  signMessage(message, address) {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    /** @const {bigint} */
    const digest = BigInt("0x" + evm.personalDigest(message));
    return Promise.resolve("0x" + signCompact(digest, this.privKey));
  }

  /** @return {string} */
  getAddress() { return addr(this.privKey); }

  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<!ArrayBuffer>}
   */
  deriveSecret(message, address) {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    /** @const {bigint} */
    const digest = BigInt("0x" + evm.personalDigest(message));
    return crypto.subtle.digest("SHA-256", hexten(signWide(digest, this.privKey)));
  }
}

export {
  addr,
  MockSigner,
  sign,
  signCompact,
  signWide,
  toCompactSignature,
  toWideSignature
};

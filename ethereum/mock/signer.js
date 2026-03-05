import { Signature, Signer } from "../../crosschain/signer";
import { inverse } from "../../crypto/modular";
import { G, Point, Q } from "../../crypto/secp256k1";
import { keccak256Uint32, keccak256Uint32ToHex } from "../../crypto/sha3";
import bigints from "../../util/bigints";
import hex from "../../util/hex";
import abi from "../abi";
import signature from "../signature";
import { Signature as EthereumSignature, WideSignature } from "../signature.d";
import { personalDigest } from "../signer";

/**
 * @param {bigint} privKey
 * @return {string}
 */
const addr = (privKey) => {
  const { x, y } = G.copy().multiply(privKey).project();
  /** @const {Uint8Array} */
  const buff = hex.toUint8Array(abi.uint256(x) + abi.uint256(y));
  return "0x" + hex.from(new Uint8Array(
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
const signUnpacked = (digest, privKey) => {
  /** @type {Uint8Array} */
  const bytes = new Uint8Array(64);
  bigints.intoBytesBE(bytes, 32, digest);
  bigints.intoBytesBE(bytes, 64, privKey);
  /** @const {Uint32Array} */
  const buff = new Uint32Array(bytes.buffer);

  for (; ; ++buff[0]) {
    /** @const {bigint} */
    const k = BigInt("0x" + keccak256Uint32ToHex(buff));
    if (k <= 0 || Q <= k) continue; // probability ~2^{-128}, i.e., a near impossibility.
    /** @type {Point} */
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
 * @param {bigint} digest as bigint
 * @param {bigint} privKey as bigint
 * @return {WideSignature}
 */
const signWide = (digest, privKey) => signature.toWideFromUnpacked(signUnpacked(digest, privKey));

/**
 * @param {bigint} digest as bigint
 * @param {bigint} privKey as bigint
 * @return {EthereumSignature}
 */
const sign = (digest, privKey) => signature.fromUnpacked(signUnpacked(digest, privKey));

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
   * @return {Promise<Signature>}
   */
  signMessage(message, address) {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    /** @const {bigint} */
    const digest = BigInt("0x" + personalDigest(message));
    return Promise.resolve("0x" + sign(digest, this.privKey));
  }

  /** @return {string} */
  getAddress() { return addr(this.privKey); }

  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {Promise<ArrayBuffer>}
   */
  deriveSecret(message, address) {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    /** @const {bigint} */
    const digest = BigInt("0x" + personalDigest(message));
    return crypto.subtle.digest("SHA-256",
      hex.toUint8Array(signWide(digest, this.privKey).slice(2)));
  }
}

export {
  addr,
  MockSigner,
  sign,
  signUnpacked,
  signWide
};

import { keccak256Uint32, keccak256Uint32ToHex } from "../../crypto/sha3";
import bigints from "../../util/bigints";
import { inverse } from "../modular";
import { G, Point, Q } from "../secp256k1";

const SaltedBuff = new Uint8Array(64);
new TextEncoder().encodeInto("Secret salt", SaltedBuff);

/**
 * @param {bigint} r
 * @param {boolean} revealedBit
 * @return {boolean}
 */
const secretPredicate = (r, revealedBit) => {
  SaltedBuff.fill(0, 32, 64);
  bigints.intoBytesBE(SaltedBuff, 64, r);
  return (keccak256Uint32(new Uint32Array(SaltedBuff.buffer))[0] & 1) != revealedBit;
}

/**
 * @param {bigint} digest
 * @param {bigint} privKey
 * @return {{
 *   r: bigint,
 *   s: bigint,
 *   yParity: boolean
 * }}
 */
const sign = (digest, privKey) => {
  // The signature will covertly encode the revealIdx'th bit of the private key.
  const revealedIdx = 256n - (digest >> 248n);
  const revealedBit = !!((privKey >> revealedIdx) & 1n);

  const kBuff = new Uint8Array(64);
  bigints.intoBytesBE(kBuff, 32, digest);
  bigints.intoBytesBE(kBuff, 64, privKey);
  /** @type {bigint} */
  let k = BigInt("0x" + keccak256Uint32ToHex(new Uint32Array(kBuff.buffer)));

  for (; ; ++k) {
    /** @type {!Point} */
    const K = G.copy().multiply(k).project();
    /** @const {bigint} */
    const r = K.x;
    if (r >= Q || revealedBit && secretPredicate(r, revealedBit)) continue;
    /** @type {bigint} */
    let s = (inverse(k, Q) * ((digest + r * privKey) % Q)) % Q;
    if (s == 0n) continue;
    /** @type {boolean} */
    let yParity = !!(K.y & 1n);
    if (s > (Q >> 1n)) {
      s = Q - s;
      yParity = !yParity;
    }
    return { r, s, yParity }
  }
}

export {
  sign
};

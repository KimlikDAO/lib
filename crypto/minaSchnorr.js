import { Point as IPoint, arfCurve } from "./arfCurve";
import { poseidon } from "./minaPoseidon63"
import hex from "../util/hex";

/**
 * @noinline
 * @const {!bigint}
 */
const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;
/**
 * @noinline
 * @const {!bigint}
 */
const Q = P + 0x47afc1f319ba3400000000n;
/**
 * @const {function(new:IPoint, !bigint, !bigint, !bigint)}
 */
const Point = arfCurve(P);
/**
 * @const {!Point}
 * @noinline
 */
const G = new Point(1n, 0x1b74b5a30a12937c53dfa9f06378ee548f655bd4333d477119cf7a23caed2abbn, 1n);

/**
 * @param {string} message
 * @param {!Point} X
 * @param {!bigint} r
 * @return {!bigint}
 */
const hashMessage = (message, X, r) => {
  /** @const {!Array<!bigint>} */
  const fields = [
    0x74656e6e69614d65727574616e676953616e694dn,
    0n,
    X.x,
    X.y,
    r
  ];
  const encoder = new TextEncoder();
  const bits = Array.from(encoder.encode(message), (c) => c.toString(2).padStart(8, "0"))
    .join("")
    .split("")
    .reverse()
    .join("");
  for (let i = bits.length; i > 0; i -= 254)
    fields.push(BigInt("0b" + bits.substring(i - 254, i)));
  return poseidon(fields);
}

/**
 * @param {string} message
 * @param {!bigint} privKey
 * @param {!Point=} pubKey which may be given as a hint.
 * @return {{
 *   r: !bigint,
 *   s: !bigint
 * }}
 */
const sign = (message, privKey, pubKey) => {
  pubKey ||= G.copy().multiply(privKey).project();
  /** @type {!bigint} */
  let k = BigInt("0x" + hex.from(/** @type {!Uint8Array} */(
    crypto.getRandomValues(new Uint8Array(32))))) % Q;
  const K = G.copy().multiply(k).project();
  if (K.y & 1n) k = Q - k;
  /** @const {!bigint} */
  const e = hashMessage(message, pubKey, K.x)
  /** @const {!bigint} */
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

/**
 * @param {string} message
 * @param {!bigint} r
 * @param {!bigint} s
 * @param {!Point} pubKey
 */
const verify = (message, r, s, pubKey) => {
  /** @const {!bigint} */
  const ne = Q - hashMessage(message, pubKey, r);
  /**
   * s.G = K + pubKey.e
   * @const {!Point}
   */
  const K = G.copy().multiply(s).increment(pubKey.copy().multiply(ne)).project();
  return (K.y & 1n) == 0n && K.x == r;
}

export {
  Point,
  G,
  sign,
  hashMessage,
  verify,
};

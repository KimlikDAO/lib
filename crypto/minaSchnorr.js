import bigints from "../util/bigints";
import { arfCurve } from "./arfCurve";
import { Point as IPoint } from "./ellipticCurve";
import { P, poseidon } from "./minaPoseidon";
import { poseidon as poseidonLegacy } from "./minaPoseidonLegacy";
import { tonelliShanks } from "./modular";

/**
 * @noinline
 * @const {bigint}
 */
const Q = P + 0x47afc1f319ba3400000000n;
/**
 * @typedef {IPoint} Point */
/**
 * @struct
 * @const {new (x: bigint, y: bigint, z?: bigint) => IPoint}
 */
const Point = arfCurve(P);
/**
 * @const {Point}
 * @noinline
 */
const G = new Point(1n, 0x1b74b5a30a12937c53dfa9f06378ee548f655bd4333d477119cf7a23caed2abbn);

/**
 * @param {bigint} n
 * @return {bigint | null}
 */
const sqrt = (n) => tonelliShanks(n, P, (P - 1n) >> 32n, 0x2bce74deac30ebda362120830561f81aea322bf2b7bb7584bdad6fabd87ea32fn, 32n);

/**
 * If x^3 + 5 is a quadratic residue, returns the point (x, y, 1) with
 * y^2 = x^3 + 5 and y having yParity, otherwise returns null.
 *
 * @param {bigint} x
 * @param {boolean} yParity
 * @return {Point | null}
 */
const pointFrom = (x, yParity) => {
  /** @const {bigint} */
  const x2 = (x * x) % P;
  /** @const {bigint} */
  const y2 = (x2 * x + 5n) % P
  /** @const {?bigint} */
  const y = sqrt(y2);
  return y
    ? new Point(x, (y & 1n) == yParity ? y : P - y)
    : null;
}

/**
 * @param {bigint[]} fields
 * @param {Point} X
 * @param {bigint} r
 * @return {bigint}
 */
const hashFields = (fields, X, r) =>
  poseidon([
    0x2a2a2a2a2a2a2a65727574616e67695361646f43n,
    0n,
    ...fields,
    X.x,
    X.y,
    r
  ]);

/**
 * @param {bigint[]} fields
 * @param {bigint} privKey
 * @param {Point=} pubKey which may be given as a hint.
 * @return {{
 *   r: bigint,
 *   s: bigint
 * }}
 */
const signFields = (fields, privKey, pubKey) => {
  pubKey ||= G.copy().multiply(privKey).project();
  /** @type {bigint} */
  let k = bigints.fromBytesBE(/** @type {Uint8Array} */(
    crypto.getRandomValues(new Uint8Array(32)))) % Q;
  /** @const {Point} */
  const K = G.copy().multiply(k).project();
  if (K.y & 1n) k = Q - k;
  /** @const {bigint} */
  const e = hashFields(fields, pubKey, K.x);
  /** @const {bigint} */
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

/**
 * @param {bigint[]} fields
 * @param {bigint} r
 * @param {bigint} s
 * @param {Point} pubKey which is modified during the verification
 * @return {boolean}
 */
const verifyFields = (fields, r, s, pubKey) => {
  /**
   * Here we use the fact that Q > P and reinterpret the field element
   * as a scalar.
   * @const {bigint} */
  const ne = Q - hashFields(fields, pubKey, r);
  /**
   * s.G = K + pubKey.e
   * @const {Point}
   */
  const K = G.copy().multiply(s).increment(pubKey.multiply(ne)).project();
  return (K.y & 1n) == 0n && K.x == r;
}

/**
 * @param {string} message
 * @param {Point} X
 * @param {bigint} r
 * @return {bigint}
 */
const hashMessage = (message, X, r) => {
  /** @const {bigint[]} */
  const fields = [
    0x74656e6e69614d65727574616e676953616e694dn,
    0n,
    X.x,
    X.y,
    r
  ];
  const encoder = new TextEncoder();
  const bits = Array.from(
    encoder.encode(message),
    (c) => /** @type {number} */(c).toString(2).padStart(8, "0")
  )
    .join("")
    .split("")
    .reverse()
    .join("");
  for (let i = bits.length; i > 0; i -= 254)
    fields.push(BigInt("0b" + bits.substring(i - 254, i)));
  return poseidonLegacy(fields);
}

/**
 * @param {string} message
 * @param {bigint} privKey
 * @param {Point=} pubKey which may be given as a hint.
 * @return {{
 *   r: bigint,
 *   s: bigint
 * }}
 */
const signMessage = (message, privKey, pubKey) => {
  pubKey ||= G.copy().multiply(privKey).project();
  /** @type {bigint} */
  let k = bigints.fromBytesBE(/** @type {Uint8Array} */(
    crypto.getRandomValues(new Uint8Array(32)))) % Q;
  const K = G.copy().multiply(k).project();
  if (K.y & 1n) k = Q - k;
  /** @const {bigint} */
  const e = hashMessage(message, pubKey, K.x)
  /** @const {bigint} */
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

/**
 * Modifies the `pubKey` parameter.
 *
 * @param {string} message
 * @param {bigint} r
 * @param {bigint} s
 * @param {Point} pubKey which is modified during verification
 * @return {boolean}
 */
const verifyMessage = (message, r, s, pubKey) => {
  /**
   * Here we use the fact that Q > P and reinterpret the field element
   * as a scalar.
   * @const {bigint} */
  const ne = Q - hashMessage(message, pubKey, r);
  /**
   * s.G = K + pubKey.e
   * @const {Point}
   */
  const K = G.copy().multiply(s).increment(pubKey.multiply(ne)).project();
  return (K.y & 1n) == 0n && K.x == r;
}

export {
  G,
  hashFields,
  hashMessage,
  P,
  Point,
  pointFrom,
  Q,
  signFields,
  signMessage,
  verifyFields,
  verifyMessage
};

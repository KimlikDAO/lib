import { uint8ArrayBEtoBigInt } from "../util/çevir";
import { Point as IPoint, arfCurve } from "./arfCurve";
import { P, poseidon } from "./minaPoseidon";

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
 * @param {!Array<!bigint>} fields
 * @param {!Point} X
 * @param {!bigint} r
 * @return {!bigint}
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
 * @param {!Array<!bigint>} fields
 * @param {!bigint} privKey
 * @param {!Point=} pubKey which may be given as a hint.
 * @return {{
 *   r: !bigint,
 *   s: !bigint
 * }}
 */
const signFields = (fields, privKey, pubKey) => {
  pubKey ||= G.copy().multiply(privKey).project();
  /** @type {!bigint} */
  let k = uint8ArrayBEtoBigInt(/** @type {!Uint8Array} */(
    crypto.getRandomValues(new Uint8Array(32)))) % Q;
  /** @const {!Point} */
  const K = G.copy().multiply(k).project();
  if (K.y & 1n) k = Q - k;
  /** @const {!bigint} */
  const e = hashFields(fields, pubKey, K.x);
  /** @const {!bigint} */
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

/**
 * @param {!Array<!bigint>} fields
 * @param {!bigint} r
 * @param {!bigint} s
 * @param {!Point} pubKey
 */
const verifyFields = (fields, r, s, pubKey) => {
  /**
   * Here we use the fact that Q > P and reinterpret the field element
   * as a scalar.
   * @const {!bigint} */
  const ne = Q - hashFields(fields, pubKey, r);
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
  P,
  Q,
  hashFields,
  signFields,
  verifyFields,
};

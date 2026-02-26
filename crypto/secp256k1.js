/**
 * @fileoverview KimlikDAO secp256k1 implementation.
 *
 * The secp256k1 is the curve
 *
 *   y^2 = x^3 + 7
 *
 * over F_P, where P = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1.
 *
 * @author KimlikDAO
 */

import bigints from "../util/bigints";
import { arfCurve, aX_bY, Point as IPoint } from "./arfCurve";
import { inverse } from "./modular";

/**
 * @noinline
 * @const {bigint}
 */
const P = (1n << 256n) - (1n << 32n) - 977n;
/**
 * @noinline
 * @const {bigint}
 */
const Q = P - 0x14551231950b75fc4402da1722fc9baeen;
/**
 * @typedef {IPoint} Point */
/**
 * @type {new (x: bigint, y: bigint, z?: bigint) => IPoint}
 */
const Point = arfCurve(P);

/**
 * @param {bigint} b
 * @param {number} pow
 * @return {bigint}
 */
const tower = (b, pow) => {
  while (pow-- > 0)
    b = b * b % P;
  return b;
}

/**
 * @param {bigint} n
 * @return {bigint}
 */
const sqrt = (n) => {
  const b2 = (((n * n) % P) * n) % P;
  const b3 = (b2 * b2 * n) % P;
  const b6 = (tower(b3, 3) * b3) % P;
  const b9 = (tower(b6, 3) * b3) % P;
  const b11 = (tower(b9, 2) * b2) % P;
  const b22 = (tower(b11, 11) * b11) % P;
  const b44 = (tower(b22, 22) * b22) % P;
  const b88 = (tower(b44, 44) * b44) % P;
  const b176 = (tower(b88, 88) * b88) % P;
  const b220 = (tower(b176, 44) * b44) % P;
  const b223 = (tower(b220, 3) * b3) % P;
  const t1 = (tower(b223, 23) * b22) % P;
  const t2 = (tower(t1, 6) * b2) % P;
  return tower(t2, 2);
}

/**
 * If x^3 + 7 is a quadratic residue, returns the point (x, y, 1) with the
 * provided x and y having yParity; otherwise returns null.
 *
 * @param {bigint} x coordinate of the curve point.
 * @param {boolean} yParity whether the y coordinate is odd.
 * @return {Point | null}
 */
const pointFrom = (x, yParity) => {
  /** @const {bigint} */
  const x2 = (x * x) % P;
  /** @const {bigint} */
  const y2 = (x2 * x + 7n) % P
  /** @const {bigint} */
  const y = sqrt(y2);
  return (y * y) % P == y2
    ? new Point(x, (y & 1n) == yParity ? y : P - y)
    : null;
}

/**
 * @const {Point}
 * @noinline
 */
const G = /** @pureOrBreakMyCode */(new Point(
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
));

/**
 * The point at infinity. This point is on
 *
 *   y^2 = x^3 + 7z^6
 *
 * but has not projection onto the z = 1 plane, as expected.
 *
 * @const {Point}
 */
const O = new Point(0n, 0n, 0n);

/**
 * @param {Point} p
 * @param {Point} q
 * @return {boolean}
 */
const equal = (p, q) => {
  q.project();
  p.project();
  return p.x == q.x && p.y == q.y;
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
  for (; ;) {
    /** @const {bigint} */
    const k = bigints.fromBytesBE(/** @type {Uint8Array} */(
      crypto.getRandomValues(new Uint8Array(32))));
    if (k <= 0 || Q <= k) continue; // probability ~2^{-128}, i.e., a near impossibility.
    /** @const {Point} */
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
 * @param {bigint} digest
 * @param {bigint} r
 * @param {bigint} s
 * @param {Point} pubKey
 * @return {boolean}
 */
const verify = (digest, r, s, pubKey) => {
  if (r <= 0n || Q <= r) return false;
  if (s <= 0n || Q <= s) return false;
  /** @const {bigint} */
  const is = inverse(s, Q);
  /** @const {Point} */
  const U = aX_bY(digest * is % Q, G.copy(), r * is % Q, pubKey.copy());
  /** @const {bigint} */
  const z2 = (U.z * U.z) % P;
  if (!z2) return false;
  if ((r * z2) % P == U.x) return true;
  r += Q;
  return (r < P) && (r * z2) % P == U.x;
}

/**
 * Recovers the signer public key (a `Point`) for a given signed digest
 * if the signature is valid; otherwise returns `O`, the point at infinity.
 *
 * @param {bigint} digest
 * @param {bigint} r
 * @param {bigint} s
 * @param {boolean} yParity
 * @return {Point} the signer public key or O.
 */
const recoverSigner = (digest, r, s, yParity) => {
  if (r <= 0n || Q <= r) return O;
  if (s <= 0n || Q <= s) return O;
  /** @const {bigint} */
  const ir = inverse(r, Q);
  /** @const {Point | null} */
  const K = pointFrom(r, yParity);
  if (!K) return O;
  return aX_bY(Q - (digest * ir % Q), G.copy(), s * ir % Q, K).project();
}

export {
  equal,
  G,
  O,
  P,
  Point,
  pointFrom,
  Q,
  recoverSigner,
  sign,
  verify
};

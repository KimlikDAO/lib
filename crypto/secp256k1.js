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

import { hex } from "../util/çevir";
import { inverse } from "./modular";

/**
 * @const {!bigint}
 * @noinline
 */
const P = (1n << 256n) - (1n << 32n) - 977n;

/**
 * @const {!bigint}
 * @noinline
 */
const N = P - 0x14551231950b75fc4402da1722fc9baeen;

/**
 * Unlike the % operation, modP always returns a positive number y such that
 *
 *   0 <= y < P  and  x = y (mod P).
 *
 * If positivity is not required, prefer the % operator.
 *
 * @param {!bigint} x
 * @return {!bigint} y such that x = y (mod P) and 0 <= y < P.
 */
const modP = (x) => {
  let res = x % P;
  return res >= 0n ? res : res + P;
}

/**
 * @param {!bigint} n
 * @return {!bigint}
 */
const sqrt = (n) => {
  /**
   * @param {!bigint} b
   * @param {number} pow
   * @return {!bigint}
   */
  const tower = (b, pow) => {
    while (pow-- > 0)
      b = b * b % P;
    return b;
  }
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
 * We work with a lifting of the secp256k1 curve defined as
 *
 *   y^2 = x^3 + 7z^6
 *
 * over (F_P)^3. The projection onto the z = 1 plane gives the regular
 * sepck256k1.
 *
 * @constructor
 * @struct
 * @param {!bigint} x
 * @param {!bigint} y
 * @param {!bigint} z
 */
function Point(x, y, z) {
  /** @type {!bigint} */
  this.x = x;
  /** @type {!bigint} */
  this.y = y;
  /** @type {!bigint} */
  this.z = z;
}

/**
 * If x^3 + 7 is a quadratic residue, returns the point (x, y, 1) with the
 * provided x and y having yParity; otherwise returns null.
 *
 * @param {!bigint} x coordinate of the curve point.
 * @param {boolean} yParity whether the y coordinate is odd.
 * @return {Point}
 */
Point.from = (x, yParity) => {
  /** @const {!bigint} */
  const x2 = (x * x) % P;
  /** @const {!bigint} */
  const y2 = (x2 * x + 7n) % P
  /** @const {!bigint} */
  const y = sqrt(y2);
  return (y * y) % P == y2
    ? new Point(x, ((y & 1n) == yParity) ? y : P - y, 1n)
    : null;
}

/**
 * @const {!Point}
 * @noinline
 */
const G = new Point(
  0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
  0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n,
  1n
);

/**
 * The point at infinity. This point is on
 *
 *   y^2 = x^3 + 7z^6
 *
 * but has not projection onto the z = 1 plane, as expected.
 *
 * @const {!Point}
 */
const O = new Point(0n, 0n, 0n);

/**
 * Project onto the z = 1 plane. Leaves `O`, the point at infinity intact.
 *
 * @return {!Point}
 */
Point.prototype.project = function () {
  if (this.z != 0n) {
    /** @const {!bigint} */
    const iz = inverse(this.z, P);
    /** @const {!bigint} */
    const iz2 = (iz * iz) % P;
    /** @const {!bigint} */
    const iz3 = (iz2 * iz) % P;
    this.x = (this.x * iz2) % P;
    this.y = (this.y * iz3) % P;
    this.z = 1n;
  }
  return this;
}

/**
 * @return {!Point}
 */
Point.prototype.negate = function () {
  this.y = P - this.y;
  return this;
}

/**
 * Multiplies the point by 2, in-place.
 *
 * @see https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#doubling-dbl-2009-l
 * @return {!Point}
 */
Point.prototype.double = function () {
  const { x, y, z } = this;
  const a = (x * x) % P;
  const b = (y * y) % P;
  const c = (b * b) % P;
  const xb = x + b;
  const d = 2n * (xb * xb - a - c) % P;
  const e = 3n * a;
  const f = (e * e) % P;
  const X = modP(f - 2n * d);
  this.y = modP(e * (d - X) - 8n * c);
  this.z = (2n * y * z) % P;
  this.x = X;
  return this;
}

/**
 * Increments the point by `other`.
 *
 * @param {!Point} other
 * @return {!Point}
 */
Point.prototype.increment = function (other) {
  const { x: x1, y: y1, z: z1 } = this;
  const { x: x2, y: y2, z: z2 } = other;

  const z1z1 = (z1 * z1) % P;
  const z2z2 = (z2 * z2) % P;
  const u1 = (x1 * z2z2) % P;
  const u2 = (x2 * z1z1) % P;
  const s1 = (((y1 * z2) % P) * z2z2) % P;
  const s2 = (((y2 * z1) % P) * z1z1) % P;
  const h = (u2 - u1) % P;
  const r = (s2 - s1) % P;

  if (h === 0n) {
    if (r === 0n) {
      if (z2 == 0n) { }
      else if (z1 == 0n) { this.x = x2; this.y = y2; this.z = z2; }
      else this.double();
    } else
      this.x = this.y = this.z = 0n;
  } else {
    const h2 = (h * h) % P;
    const h3 = (h * h2) % P;
    const v = (u1 * h2) % P;
    const X = modP(r * r - h3 - 2n * v);
    this.y = modP(r * (v - X) - s1 * h3);
    this.z = modP(z1 * z2 * h);
    this.x = X;
  }
  return this;
}

/**
 * Creates a copy of the `Point`.
 *
 * @return {!Point}
 */
Point.prototype.copy = function () {
  return new Point(this.x, this.y, this.z);
}

/**
 * Multiplies the point by the scalar `n` in-place.
 *
 * @param {!bigint} n
 * @return {!Point}
 */
Point.prototype.multiply = function (n) {
  if (!n) {
    this.x = this.y = this.z = 0n;
    return this;
  }
  /** @const {string} */
  const nBits = n.toString(2);
  /** @const {!Point} */
  const d = this.copy();

  for (let i = 1; i < nBits.length; ++i) {
    this.double();
    if (nBits.charCodeAt(i) == 49)
      this.increment(d);
  }
  return this;
}

/**
 * @param {!bigint} a
 * @param {!bigint} b
 * @param {!Point} H
 * @return {!Point} a.G + b.H
 */
const aGbH = (a, b, H) => G.copy().multiply(a).increment(H.multiply(b));

/**
 * @param {!Point} p
 * @param {!Point} q
 * @return {boolean}
 */
const equal = (p, q) => {
  q.project();
  p.project();
  return p.x == q.x && p.y == q.y;
}

/**
 * @param {!bigint} digest
 * @param {!bigint} privKey
 * @return {{
 *   r: !bigint,
 *   s: !bigint,
 *   yParity: boolean
 * }}
 */
const sign = (digest, privKey) => {
  for (; ;) {
    /** @const {!bigint} */
    const k = BigInt("0x" + hex(/** @type {!Uint8Array} */(
      crypto.getRandomValues(new Uint8Array(32)))));
    if (k <= 0 || N <= k) continue; // probability ~2^{-128}, i.e., a near impossibility.
    /** @const {!Point} */
    const K = G.copy().multiply(k).project();
    /** @const {!bigint} */
    const r = K.x;
    if (r >= N) continue; // probability ~2^{-128}, i.e., a near impossibility.
    /** @type {!bigint} */
    let s = (inverse(k, N) * ((digest + r * privKey) % N)) % N;
    if (s == 0n) continue; // probability ~2^{-256}
    /** @type {boolean} */
    let yParity = !!(K.y & 1n);
    if (s > (N >> 1n)) {
      s = N - s;
      yParity = !yParity;
    }
    return { r, s, yParity }
  }
}

/**
 * @param {!bigint} digest
 * @param {!bigint} r
 * @param {!bigint} s
 * @param {!Point} pubKey
 * @return {boolean}
 */
const verify = (digest, r, s, pubKey) => {
  if (r <= 0n || N <= r) return false;
  if (s <= 0n || N <= s) return false;
  /** @const {!bigint} */
  const is = inverse(s, N);
  /** @const {!Point} */
  const U = aGbH(digest * is % N, r * is % N, pubKey.copy());
  /** @const {!bigint} */
  const z2 = (U.z * U.z) % P;
  if (!z2) return false;
  if ((r * z2) % P === U.x) return true;
  r += N;
  return (r < P) && (r * z2) % P === U.x;
}

/**
 * Recovers the signer public key (a `!Point`) for a given signed digest
 * if the signature is valid; otherwise returns `O`, the point at infinity.
 *
 * @param {!bigint} digest
 * @param {!bigint} r
 * @param {!bigint} s
 * @param {boolean} yParity
 * @return {!Point} the signer public key or O.
 */
const recoverSigner = (digest, r, s, yParity) => {
  if (r <= 0n || N <= r) return O;
  if (s <= 0n || N <= s) return O;
  /** @const {!bigint} */
  const ir = inverse(r, N);
  /** @const {Point} */
  const K = Point.from(r, yParity);
  if (!K) return O;
  return aGbH(N - (digest * ir % N), s * ir % N, K).project();
}

export {
  equal,
  G,
  N,
  O,
  P,
  Point,
  recoverSigner,
  sign,
  verify,
};

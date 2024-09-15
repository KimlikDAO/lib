/**
 * An elliptic curve over a prime field given by the equation
 *
 *   y^2 = x^3 + b.
 * 
 * @author KimlikDAO
 */

import { inverse } from "./modular";

/**
 * We work with a lifting of the Arf curve x^2 = y^3 + b
 *
 *   y^2 = x^3 + b.z^6
 *
 * over (F_P)^3. The projection onto the z = 1 plane gives the regular
 * Arf curve.
 *
 * @interface
 */
class Point {
  /** @type {bigint} */
  x;
  /** @type {bigint} */
  y;
  /** @type {bigint} */
  z;

  /**
   * @pureOrBreakMyCode
   * @param {bigint} x
   * @param {bigint} y
   * @param {bigint=} z
   */
  constructor(x, y, z) { }

  /**
   * @return {!Point}
   */
  project() { }

  /**
   * Negates the point in place.
   * @return {!Point}
   */
  negate() { }

  /**
   * Doubles the point in place.
   * @return {!Point}
   */
  double() { }

  /**
   * @param {!Point} other
   * @return {!Point}
   */
  increment(other) { }

  /**
   * @param {bigint} n
   * @return {!Point}
   */
  multiply(n) { }

  /**
   * @return {!Point}
   */
  copy() { }
}

/**
 * @nosideeffects
 * @pureOrBreakMyCode
 * @param {bigint} P
 * @return {function(new:Point, bigint, bigint, bigint=)}
 */
const arfCurve = (P) => {
  /**
   * Unlike the % operation, modP always returns a positive number y such that
   *
   *   0 <= y < P  and  x = y (mod P).
   *
   * If positivity is not required, prefer the % operator.
   *
   * @param {bigint} x
   * @return {bigint} y such that x = y (mod P) and 0 <= y < P.
   */
  const modP = (x) => {
    let res = x % P;
    return res >= 0n ? res : res + P;
  }

  return /** @implements {Point} */ class CurvePoint {
    /**
     * @nosideeffects
     * @param {bigint} x
     * @param {bigint} y
     * @param {bigint=} z
     */
    constructor(x, y, z) {
      /** @type {bigint} */
      this.x = x;
      /** @type {bigint} */
      this.y = y;
      /** @type {bigint} */
      this.z = z ?? 1n;
    }

    /** @return {!Point} */
    copy() {
      return new CurvePoint(this.x, this.y, this.z);
    }

    /** @return {!Point} */
    project() {
      if (this.z != 0n) {
        /** @const {bigint} */
        const iz = inverse(this.z, P);
        /** @const {bigint} */
        const iz2 = (iz * iz) % P;
        /** @const {bigint} */
        const iz3 = (iz2 * iz) % P;
        this.x = (this.x * iz2) % P;
        this.y = (this.y * iz3) % P;
        this.z = 1n;
      }
      return this;
    }

    /** @return {!Point} */
    negate() {
      this.y = P - this.y;
      return this;
    }

    /**
     * Multiplies the point by 2, in-place.
     *
     * @see https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#doubling-dbl-2009-l
     * @return {!Point}
     */
    double() {
      const { x, y, z } = this;
      const x2 = (x * x) % P;
      const y2 = (y * y) % P;
      const y4 = (y2 * y2) % P;
      const _4xy2 = 4n * x * y2 % P;
      const _3x2 = 3n * x2 % P;
      const _9x4 = _3x2 * _3x2 % P;
      const X = modP(_9x4 - 2n * _4xy2);
      this.y = modP(_3x2 * (_4xy2 - X) - 8n * y4);
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
    increment(other) {
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
     * Multiplies the point by the scalar `n` in-place.
     * TODO(KimlikDAO-bot) consider method copying from the interface for `multiply`
     *
     * @param {bigint} n
     * @return {!Point}
     */
    multiply(n) {
      if (!n) {
        this.x = this.y = this.z = 0n;
      } else {
        /** @const {string} */
        const nNibs = n.toString(4);
        /** @const {!Array<!Point>} */
        const d = [
          O, this.copy(),
          this.copy().double(), this.copy().double().increment(this)
        ];
        ({ x: this.x, y: this.y, z: this.z } = d[nNibs.charCodeAt(0) - 48]);
        for (let i = 1; i < nNibs.length; ++i) {
          this.double(); this.double();
          this.increment(d[nNibs.charCodeAt(i) - 48]);
        }
      }
      return this;
    }
  }
}

/** @const {!Point} */
const O = /** @type {!Point} */({ x: 0n, y: 0n, z: 0n });

/**
 * Computes aX + bY at the cost of a single scalar x point multiplication.
 *
 * @pureOrBreakMyCode
 * @param {bigint} a
 * @param {!Point} X
 * @param {bigint} b
 * @param {!Point} Y
 * @return {!Point} aX + bY
 */
const aX_bY = (a, X, b, Y) => {
  /** @type {string} */
  let aBits = a.toString(2);
  /** @type {string} */
  let bBits = b.toString(2);
  if (aBits.length > bBits.length)
    bBits = bBits.padStart(aBits.length, "0");
  else if (bBits.length > aBits.length)
    aBits = aBits.padStart(bBits.length, "0");
  /** @const {!Array<!Point>} */
  const d = [O, X, Y, X.copy().increment(Y)];
  /** @type {!Point} */
  let R = d[(aBits.charCodeAt(0) - 48) + 2 * (bBits.charCodeAt(0) - 48)].copy();
  for (let i = 1; i < aBits.length; ++i) {
    R.double();
    R.increment(d[(aBits.charCodeAt(i) - 48) + 2 * (bBits.charCodeAt(i) - 48)]);
  }
  return R;
}

export { arfCurve, aX_bY, Point };

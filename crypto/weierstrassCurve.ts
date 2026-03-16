import { AffinePoint, CompressedPoint, Curve, Point } from "./ellipticCurve";
import { inverse, prepareSqrt } from "./modular";

/**
 * Returns an elliptic curve over the field 𝔽ₚ with equation y² = x³ + ax + b.
 *
 * A function `sqrt` can be provided to compute square roots in 𝔽ₚ. If not
 * provided, Tonelli-Shanks parameters for the given P will be computed at
 * construction time and `sqrt(x)` (needed for `pointFrom()`) will be calculated
 * using the Tonelli-Shanks algorithm with these parameters.
 *
 * This implementation uses the Renes Costello and Batina homogenous lifting of
 * the y² = x³ + ax + b curve:
 *
 *   zy² = x³ + axz² + bz³ ,
 *
 * where the z=1 projection gives the original curve. This lifting lends itself
 * to complete addition and doubling laws.
 * @see https://eprint.iacr.org/2015/1060.pdf
 *
 * Combined with our base-4 multiplication ladder, this should make the
 * implementation as close to constant-time as possible.
 *
 * @param P - The prime modulus of the base field 𝔽ₚ.
 * @param a - The coefficient of the x term.
 * @param b - The coefficient of the x³ term.
 * @param sqrt - The function to compute square roots in 𝔽ₚ.
 * @returns The elliptic curve.
 * @pure
 */
const weierstrassCurve = (
  P: bigint, a: bigint, b: bigint,
  sqrt: (x: bigint) => bigint | null = prepareSqrt(P)
): Curve => {
  /**
   * Returns a non-negative number t such that 0 ≤ t < P and x ≡ t (mod P).
   * If positivity is not required, prefer the % operator.
   * @pure
   */
  const modP = (x: bigint): bigint => {
    const t = x % P;
    return t >= 0n ? t : t + P;
  };
  a = modP(a);
  const b3 = modP(3n * b);
  return class WeierstrassPoint implements Point {
    /** Provided x, y and z must all be in [0, P) */
    constructor(public x: bigint, public y: bigint, public z: bigint) { }
    /** @pure */
    static pointFromAffine({ x, y }: AffinePoint): Point {
      return new WeierstrassPoint(modP(x), modP(y), 1n);
    };
    /** @pure x must be in [0, P) */
    static pointFrom({ x, yParity }: CompressedPoint): Point | null {
      const y = sqrt(x * (x * x + a) + b);
      if (y == null) return null;
      return new WeierstrassPoint(x, (y & 1n) == (yParity as unknown as bigint) ? y : P - y, 1n);
    }
    /** @pure */
    copy(): Point { return new WeierstrassPoint(this.x, this.y, this.z); }
    /** @pure */
    proj(): AffinePoint {
      if (this.z == 0n) return { x: 0n, y: 0n };
      const iz = inverse(this.z, P);
      return { x: this.x * iz % P, y: this.y * iz % P };
    }
    negate(): Point {
      this.y = P - this.y;
      return this;
    }
    double(): Point {
      const { x: x1, y: y1, z: z1 } = this;
      let x3: bigint;
      let y3: bigint;
      let z3: bigint;
      let t0 = x1 * x1 % P;
      let t1 = y1 * y1 % P;
      let t2 = z1 * z1 % P;
      let t3 = x1 * y1 % P;
      t3 = (t3 + t3) % P;
      z3 = (x1 * z1) % P;
      z3 = (z3 + z3) % P;
      x3 = a * z3 % P;
      y3 = b3 * t2 % P;
      y3 = (x3 + y3) % P;
      x3 = modP(t1 - y3);
      y3 = (t1 + y3) % P;
      y3 = x3 * y3 % P;
      x3 = t3 * x3 % P;
      z3 = b3 * z3 % P;
      t2 = a * t2 % P;
      t3 = modP(t0 - t2);
      t3 = a * t3 % P;
      t3 = (t3 + z3) % P;
      z3 = (t0 + t0) % P;
      t0 = (z3 + t0) % P;
      t0 = (t0 + t2) % P;
      t0 = t0 * t3 % P;
      this.y = (y3 + t0) % P;
      t2 = y1 * z1 % P;
      t2 = (t2 + t2) % P;
      t0 = t2 * t3 % P;
      this.x = modP(x3 - t0);
      z3 = t2 * t1 % P;
      z3 = (z3 + z3) % P;
      this.z = (z3 + z3) % P;
      return this;
    }
    increment(other: Point): Point {
      const { x: x1, y: y1, z: z1 } = this;
      const { x: x2, y: y2, z: z2 } = other;
      let x3: bigint;
      let y3: bigint;
      let z3: bigint;
      let t0 = x1 * x2 % P;
      let t1 = y1 * y2 % P;
      let t2 = z1 * z2 % P;
      let t3 = (x1 + y1) % P;
      let t4 = (x2 + y2) % P;
      t3 = t3 * t4 % P;
      t4 = (t0 + t1) % P;
      t3 = modP(t3 - t4);
      t4 = (x1 + z1) % P;
      let t5 = (x2 + z2) % P;
      t4 = t4 * t5 % P;
      t5 = (t0 + t2) % P;
      t4 = modP(t4 - t5);
      t5 = (y1 + z1) % P;
      x3 = (y2 + z2) % P;
      t5 = t5 * x3 % P;
      x3 = (t1 + t2) % P;
      t5 = modP(t5 - x3);
      z3 = a * t4 % P;
      x3 = b3 * t2 % P;
      z3 = (x3 + z3) % P;
      x3 = modP(t1 - z3);
      z3 = (t1 + z3) % P;
      y3 = x3 * z3 % P;
      t1 = (t0 + t0) % P;
      t1 = (t1 + t0) % P;
      t2 = a * t2 % P;
      t4 = b3 * t4 % P;
      t1 = (t1 + t2) % P;
      t2 = modP(t0 - t2);
      t2 = a * t2 % P;
      t4 = (t4 + t2) % P;
      t0 = t1 * t4 % P;
      this.y = (y3 + t0) % P;
      t0 = t5 * t4 % P;
      x3 = t3 * x3 % P;
      this.x = modP(x3 - t0);
      t0 = t3 * t1 % P;
      z3 = t5 * z3 % P;
      this.z = (z3 + t0) % P;
      return this;
    }
    static readonly O: Point = new WeierstrassPoint(0n, 0n, 0n);
    multiply(n: bigint): Point {
      const nNibs = n.toString(4);
      const d: readonly Point[] = [
        WeierstrassPoint.O,
        this.copy(),
        this.copy().double(),
        this.copy().double().increment(this)
      ];
      ({ x: this.x, y: this.y, z: this.z } = d[nNibs.charCodeAt(0) - 48]);
      for (let i = 1; i < nNibs.length; ++i) {
        this.double(); this.double();
        this.increment(d[nNibs.charCodeAt(i) - 48]);
      }
      return this;
    }
  } as Curve;
}

export { weierstrassCurve };

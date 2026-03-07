import { Curve, Point } from "./ellipticCurve";
import { inverse } from "./modular";

/**
 * Returns an Arf curve over the base field 𝔽ₚ for a given prime P: an elliptic
 * curve with equation y² = x³ + b for some b. For P ≡ 1 (mod 6) there are
 * 6 isomorphism classes; which one you get is determined by the generator you
 * choose (or equivalently the choice of b in the curve equation).
 *
 * Some popular choices:
 * - secp256k1:
 *   P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
 *   y² = x³ + 7
 * - Pallas:
 *   P = 0x40000000000000000000000000000000224698FC094CF91B992D30ED00000001
 *   y² = x³ + 5
 * @pure
 */
const arfCurve = (P: bigint): Curve => {
  /**
   * Unlike the % operation, modP always returns a positive number y such that
   *
   *   0 <= y < P  and  x = y (mod P).
   *
   * If positivity is not required, prefer the % operator.
   * @pure
   */
  const modP = (x: bigint): bigint => {
    let res = x % P;
    return res >= 0n ? res : res + P;
  };

  /**
   * A fake point used in the multiplication subroutine. Always appears as RHS
   * so a bare object works.
   */
  const O = { x: 0n, y: 0n, z: 0n } as Point;

  return class CurvePoint implements Point {
    constructor(public x: bigint, public y: bigint, public z: bigint = 1n) {}
    /** @pure */
    copy(): Point { return new CurvePoint(this.x, this.y, this.z); }
    project(): Point {
      if (this.z != 0n) {
        const iz = inverse(this.z, P);
        const iz2 = (iz * iz) % P;
        const iz3 = (iz2 * iz) % P;
        this.x = (this.x * iz2) % P;
        this.y = (this.y * iz3) % P;
        this.z = 1n;
      }
      return this;
    }
    negate(): Point {
      this.y = P - this.y;
      return this;
    }
    double(): Point {
      const { x, y } = this;
      const x2 = x * x % P;
      const y2 = y * y % P;
      const y4 = y2 * y2 % P;
      const _4xy2 = ((x * y2) << 2n) % P;
      const _3x2 = 3n * x2 % P;
      const _9x4 = _3x2 * _3x2 % P;
      this.x = modP(_9x4 - (_4xy2 << 1n));
      this.y = modP(_3x2 * (_4xy2 - this.x) - (y4 << 3n));
      this.z *= y << 1n; this.z %= P;
      return this;
    }
    increment(other: Point): Point {
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
      if (h == 0n) {
        if (r == 0n) {
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
    multiply(n: bigint): Point {
      const nNibs = n.toString(4);
      const d: readonly Point[] = [
        O, this.copy(),
        this.copy().double(), this.copy().double().increment(this)
      ];
      ({ x: this.x, y: this.y, z: this.z } = d[nNibs.charCodeAt(0) - 48]);
      for (let i = 1; i < nNibs.length; ++i) {
        this.double(); this.double();
        this.increment(d[nNibs.charCodeAt(i) - 48]);
      }
      return this;
    }
  }
}

export { arfCurve };

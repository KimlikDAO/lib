import { AffinePoint, CurveFamily, Point } from "./ellipticCurve";
import { inverse } from "./modular";

/**
 * Returns a short-Weierstrass curve family over 𝔽ₚ with equation
 * y² = x³ + ax + b for a fixed (P, a) and varying b.
 *
 * Fixing b (thus selecting a concrete curve from the family) is done by
 * implementing `pointFrom({ x, yParity })` on an object extending
 * this family and implementing the `Curve` interface.
 *
 * @pure
 */
const weierstrassCurve = (P: bigint, a: bigint): CurveFamily => {
  /**
   * Returns a non-negative number t such that 0 ≤ t < P and x ≡ t (mod P).
   * If positivity is not required, prefer the % operator.
   * @pure
   */
  const modP = (x: bigint): bigint => {
    let t = x % P;
    return t >= 0n ? t : t + P;
  };
  return class WeierstrassFamilyPoint implements Point {
    constructor(public x: bigint, public y: bigint, public z: bigint) { }
    /** @pure */
    static pointFromAffine({ x, y }: AffinePoint): Point {
      return new WeierstrassFamilyPoint(x, y, 1n);
    };
    /** @pure */
    copy(): Point { return new WeierstrassFamilyPoint(this.x, this.y, this.z); }
    /** @pure */
    proj(): AffinePoint {
      if (this.z == 0n) return { x: 0n, y: 0n };
      const iz = inverse(this.z, P);
      const iz2 = iz * iz % P;
      const iz3 = iz2 * iz % P;
      const x = this.x * iz2 % P;
      const y = this.y * iz3 % P;
      return { x, y };
    }
    negate(): Point {
      this.y = P - this.y;
      return this;
    }
    double(): Point {
      if (this.z == 0n || this.y == 0n) {
        this.x = this.y = this.z = 0n;
        return this;
      }
      const { x, y, z } = this;
      const x2 = x * x % P;
      const y2 = y * y % P;
      const y4 = y2 * y2 % P;
      const z2 = z * z % P;
      const z4 = z2 * z2 % P;
      const _4xy2 = (4n * x % P) * y2 % P;
      const M = modP(3n * x2 + a * z4);
      const X = modP(M * M - (_4xy2 << 1n));
      this.y = modP(M * (_4xy2 - X) - (y4 << 3n));
      this.z = modP((y << 1n) * z);
      this.x = X;
      return this;
    }
    increment(other: Point): Point {
      const { x: x1, y: y1, z: z1 } = this;
      const { x: x2, y: y2, z: z2 } = other;
      const z1z1 = z1 * z1 % P;
      const z2z2 = z2 * z2 % P;
      const u1 = x1 * z2z2 % P;
      const u2 = x2 * z1z1 % P;
      const s1 = y1 * z2 * z2z2 % P;
      const s2 = y2 * z1 * z1z1 % P;
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
        const h2 = h * h % P;
        const h3 = h * h2 % P;
        const v = u1 * h2 % P;
        const X = modP(r * r - h3 - 2n * v);
        this.y = modP(r * (v - X) - s1 * h3);
        this.z = modP(z1 * z2 * h);
        this.x = X;
      }
      return this;
    }

    static readonly O: WeierstrassFamilyPoint = new WeierstrassFamilyPoint(0n, 0n, 0n);

    multiply(n: bigint): Point {
      const nNibs = n.toString(4);
      const d: readonly WeierstrassFamilyPoint[] = [
        WeierstrassFamilyPoint.O,
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
  } as CurveFamily;
}

export { weierstrassCurve };

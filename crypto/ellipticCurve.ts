interface Point {
  x: bigint;
  y: bigint;
  z: bigint;

  negate(): Point;
  double(): Point;
  increment(other: Point): Point;
  multiply(n: bigint): Point;
  /** @pure */
  proj(): AffinePoint;
  /** @pure */
  copy(): Point;
}

type AffinePoint = { x: bigint, y: bigint };

type CompressedPoint = { x: bigint, yParity: boolean };

type CurveFamily = typeof CurveFamilyPoint;

type Curve = typeof CurvePoint;

class CurveFamilyPoint implements Point {
  constructor(public x: bigint, public y: bigint, public z: bigint) { }
  negate(): Point { return this; }
  double(): Point { return this; }
  increment(_other: Point): Point { return this; }
  multiply(_n: bigint): Point { return this; }
  /** @pure */
  proj(): AffinePoint { return { x: this.x, y: this.y }; }
  /** @pure */
  copy(): Point { return new CurveFamilyPoint(this.x, this.y, this.z); }
  /** @pure */
  static pointFromAffine({ x, y }: AffinePoint): Point {
    return new CurveFamilyPoint(x, y, 1n);
  };
}

class CurvePoint extends CurveFamilyPoint {
  /** @pure */
  static pointFrom(_C: CompressedPoint): Point | null { return null };
}

/** @pure */
const compressPoint = ({ x, y }: AffinePoint): CompressedPoint => ({ x, yParity: !!(y & 1n) });

/**
 * Computes aX + bY at the cost of a single scalar × point multiplication.
 *
 * @pure
 */
const aX_bY = (a: bigint, X: Point, b: bigint, Y: Point): Point => {
  let aBits = a.toString(2);
  let bBits = b.toString(2);
  if (aBits.length > bBits.length)
    bBits = bBits.padStart(aBits.length, "0");
  else if (bBits.length > aBits.length)
    aBits = aBits.padStart(bBits.length, "0");
  const O = X.copy().multiply(0n);
  const X_Y = X.copy().increment(Y);
  const d: readonly Point[] = [O, X, Y, X_Y];
  let R = d[(aBits.charCodeAt(0) - 48) + 2 * (bBits.charCodeAt(0) - 48)].copy();
  for (let i = 1; i < aBits.length; ++i) {
    R.double();
    R.increment(d[(aBits.charCodeAt(i) - 48) + 2 * (bBits.charCodeAt(i) - 48)]);
  }
  return R;
}

export {
  AffinePoint,
  CompressedPoint,
  Curve,
  CurveFamily,
  Point,
  aX_bY,
  compressPoint
};

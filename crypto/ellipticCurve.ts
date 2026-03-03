interface Point {
  x: bigint;
  y: bigint;
  z: bigint;

  project(): Point;
  negate(): Point;
  double(): Point;
  increment(other: Point): Point;
  multiply(n: bigint): Point;
  copy(): Point;
}

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
  // Get the point at infinity this way since we don't have an
  // explicit implementation exporting `O` yet.
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

/**
 * Used mostly for testing, prefer more efficient alternatives.
 *
 * @pure Marked pure because the caller should not rely on the project() side
 * effects.
 */
const equal = (P: Point, Q: Point): boolean => {
  Q.project();
  P.project();
  return P.x == Q.x && P.y == Q.y;
}

export { aX_bY, equal, Point };

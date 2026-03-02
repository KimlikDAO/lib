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

export { Point };

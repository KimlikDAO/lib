export type AffinePoint = {
  x: bigint;
  y: bigint;
}

export class Point {
  double(): Point;
  add(other: Point): Point;
  toAffine(): AffinePoint;

  static BASE: Point;
}

type ECDSASignOptions = {
  prehash?: boolean;
  lowS?: boolean;
  extraEntropy?: Uint8Array | boolean;
  format?: string;
}

export function signAsync(
  digest: Uint8Array,
  privKey: Uint8Array,
  options?: ECDSASignOptions
): Promise<Uint8Array>;

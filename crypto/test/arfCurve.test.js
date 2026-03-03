import { describe, expect, test } from "bun:test";
import { arfCurve, Point as IPoint } from "../arfCurve";
import { aX_bY } from "../ellipticCurve";
import { pointFrom } from "../minaSchnorr";

/** @const {bigint} */
const P = 13n;
/** @const {bigint} */
const Q = 19n;

/**
 * Some experiments with pair elliptic curves of 𝔽_13 and 𝔽_19
 * both given by the equation
 *
 *  y² = x³ + 2
 *
 * @const {new (x: bigint, y: bigint, z?: bigint) => IPoint} */
const Point = arfCurve(P);
/**
 * @const {new (x: bigint, y: bigint, z?: bigint) => IPoint} */
const Qoint = arfCurve(Q);

/** @const {Point} */
const Gp = new Point(1n, 4n);
/** @const {Qoint} */
const Gq = new Qoint(4n, 3n);

test("the order of Point is the base field of Qoint", () => {
  expect(Gp.copy().multiply(Q)).toEqual(new Point(0n, 0n, 0n));
});

test("the order of Qoint is the base field of Point", () => {
  expect(Gq.copy().multiply(P)).toEqual(new Qoint(0n, 0n, 0n));
});

describe("Efficient aX + bY tests", () => {
  /**
   * Pallas field size
   *
   * @noinline
   * @const {bigint}
   */
  const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;

  /**
   * Pallas point
   *
   * @struct
   * @const {new (x: bigint, y: bigint, z?: bigint) => IPoint}
   */
  const Point = arfCurve(P);

  /**
   * A point on the curve (-1)^3 + 5 = 2^2.
   *
   * @noinline
   * @const {Point}
   */
  const X = new Point(P - 1n, 2n);

  /**
   * Another point on the curve.
   *
   * @noinline
   * @const {Point}
   */
  const Y = pointFrom(P - 2n, false) || X;

  test("with basic examples", () => {
    const a = 12312313n;
    const b = 8458345683n;
    for (let i = 0n; i < 10n; ++i)
      for (let j = 0n; j < 10n; ++j)
        expect(aX_bY(a + i, X.copy(), b + j, Y.copy()).project())
          .toEqual(X.copy().multiply(a + i).increment(Y.copy().multiply(b + j)).project());
  })
});

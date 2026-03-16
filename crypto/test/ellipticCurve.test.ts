import { describe, expect, test } from "bun:test";
import { aX_bY } from "../ellipticCurve";
import { P, Pallas } from "../minaSchnorr";

describe("Efficient aX + bY tests", () => {
  /**
   * A point on the curve (-1)^3 + 5 = 2^2.
   */
  const X = Pallas.pointFromAffine({ x: P - 1n, y: 2n });

  /**
   * Another point on the curve.
   */
  const Y = Pallas.pointFrom({ x: P - 2n, yParity: false }) || X;

  test("with basic examples", () => {
    const a = 12312313n;
    const b = 8458345683n;
    for (let i = 0n; i < 10n; ++i)
      for (let j = 0n; j < 10n; ++j)
        expect(aX_bY(a + i, X.copy(), b + j, Y.copy()).proj())
          .toEqual(X.copy().multiply(a + i).increment(Y.copy().multiply(b + j)).proj());
  })
});

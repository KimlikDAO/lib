import { describe, expect, test } from "bun:test";
import { arfCurve } from "../arfCurve";
import { aX_bY } from "../ellipticCurve";
import { P, Pallas } from "../minaSchnorr";

describe("Purve, Qurve curves", () => {
  const P = 13n;
  const Q = 19n;
  /**
   * Some experiments with pair elliptic curves of 𝔽_13 and 𝔽_19
   * both given by the equation.
   *
   *  y² = x³ + 2
   */
  const Purve = arfCurve(P);
  const Qurve = arfCurve(Q);

  const Gp = Purve.pointFromAffine({ x: 1n, y: 4n });
  const Gq = Qurve.pointFromAffine({ x: 4n, y: 3n });
  const Op = new Purve(0n, 0n, 0n);
  const Oq = new Qurve(0n, 0n, 0n);

  test("the scalar field of Purve is the base field of Qurve", () => {
    expect(Gp.copy().multiply(Q)).toEqual(Op);
  });

  test("the scalar field of Qurve is the base field of Purve", () => {
    expect(Gq.copy().multiply(P)).toEqual(Oq);
  });
});

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

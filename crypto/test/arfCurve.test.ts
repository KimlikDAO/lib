import { describe, expect, test } from "bun:test";
import bigints from "../../util/bigints";
import { arfCurve } from "../arfCurve";
import { CurveFamily, Point } from "../ellipticCurve";

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

  test("the scalar field of Purve is the base field of Qurve", () => {
    expect(Gp.copy().multiply(Q)).toEqual(Purve.O);
  });

  test("the scalar field of Qurve is the base field of Purve", () => {
    expect(Gq.copy().multiply(P)).toEqual(Qurve.O);
  });
});

describe("group laws", () => {
  const P = 0x24240D8241D5445106C8442084001384E0000013n;
  const Bn158: CurveFamily = arfCurve(P);
  const G: Point = Bn158.pointFromAffine({
    x: P - 1n, // y² = x³ + 17
    y: 4n      // 4² = -1³ + 17
  });
  const O: Point = Bn158.O;
  const A = G.copy().multiply(bigints.random(158));
  const B = G.copy().multiply(bigints.random(158));
  const C = G.copy().multiply(bigints.random(158));

  describe("identity element", () => {
    test("A + O = A", () => {
      expect(A.copy().increment(O).proj()).toEqual(A.proj());
    });
    test("O + A = A", () => {
      expect(O.copy().increment(A).proj()).toEqual(A.proj());
    });
    test("O + O = O", () => {
      expect(O.copy().increment(O).proj()).toEqual(O.proj());
    });
  });

  describe("inverse element", () => {
    test("A + (-A) = O", () => {
      expect(A.copy().increment(A.copy().negate()).proj()).toEqual(O.proj());
    });
    test("(-A) + A = O", () => {
      expect(A.copy().negate().increment(A).proj()).toEqual(O.proj());
    });
  });

  describe("associativity", () => {
    test("(A + B) + C = A + (B + C)", () => {
      expect(A.copy().increment(B).copy().increment(C).proj())
        .toEqual(A.copy().increment(B.copy().increment(C)).proj());
    });
    test("A + (B + C) = (A + B) + C", () => {
      expect(A.copy().increment(B.copy().increment(C)).proj())
        .toEqual(A.copy().increment(B).copy().increment(C).proj());
    });
  });

  describe("commutativity", () => {
    test("A + B = B + A", () => {
      expect(A.copy().increment(B).proj())
        .toEqual(B.copy().increment(A).proj());
    });
  });

  describe("distributivity", () => {
    test("a(A + B) = aA + aB", () => {
      const a = bigints.random(158);
      expect(A.copy().increment(B).copy().multiply(a).proj())
        .toEqual(A.copy().multiply(a).increment(B.copy().multiply(a)).proj());
    });
    test("(a + b)A = aA + bA", () => {
      const a = bigints.random(158);
      const b = bigints.random(158);
      expect(A.copy().multiply(a + b).proj())
        .toEqual(A.copy().multiply(a).increment(A.copy().multiply(b)).proj());
    });
  });
});

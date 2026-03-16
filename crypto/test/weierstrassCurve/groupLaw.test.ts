import { describe, expect, test } from "bun:test";
import bigints from "../../../util/bigints";
import { Point } from "../../ellipticCurve";
import { G, Q, Secp192r1 } from "./secp192r1";

const O: Point = Secp192r1.O;
const A = G.copy().multiply(bigints.random(24));
const B = G.copy().multiply(bigints.random(24));
const C = G.copy().multiply(bigints.random(24));

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
    const a = bigints.random(24);
    expect(A.copy().increment(B).copy().multiply(a).proj())
      .toEqual(A.copy().multiply(a).increment(B.copy().multiply(a)).proj());
  });
  test("(a + b)A = aA + bA", () => {
    const a = bigints.random(24);
    const b = bigints.random(24);
    expect(A.copy().multiply(a + b).proj())
      .toEqual(A.copy().multiply(a).increment(A.copy().multiply(b)).proj());
  });
  test("aA + (Q-a)A = O", () => {
    const a = bigints.random(24);
    const A = G.copy().multiply(a);
    A.increment(G.copy().multiply(Q - a));
    expect(A.proj()).toEqual(O.proj());
  });
});

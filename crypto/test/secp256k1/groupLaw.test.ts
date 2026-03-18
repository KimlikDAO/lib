import { expect, test } from "bun:test";
import { Point } from "../../ellipticCurve";
import { G, Q, Secp256k1 } from "../../secp256k1";

const O: Point = Secp256k1.O;

const equals = (P: Point, Q: Point): boolean => {
  const A = P.proj();
  const B = Q.proj();
  return A.x == B.x && A.y == B.y;
}

test("copies of points are equal", () => {
  const P = G.copy();
  const Q = G.copy();
  expect(equals(P, G)).toBeTrue();
  expect(equals(P, Q)).toBeTrue();
});

test("`O` behaves as identity", () => {
  const P = G.copy().increment(O);
  expect(equals(P, G)).toBeTrue();

  const Q = O.copy().increment(G);
  expect(equals(Q, G)).toBeTrue();

  const R = O.copy().increment(O);
  expect(equals(R, O)).toBeTrue();

  const S = O.copy().double();
  expect(equals(S, O)).toBeTrue();

  const T = O.copy().multiply(5n);
  expect(equals(T, O)).toBeTrue();

  const U = O.copy().multiply(0n);
  expect(equals(U, O)).toBeTrue();

  const V = G.copy().multiply(0n);
  expect(equals(V, O)).toBeTrue();
});

test("G + O == G", () => {
  for (let i = 0; i < 1000; ++i) {
    const iG = G.copy().multiply(BigInt(i) + 1231283129313123123n);
    const iGG = iG.copy().increment(O);
    expect(equals(iG, iGG)).toBeTrue();
  }
});

test("A = B => proj(A) = proj(B)", () => {
  const R = O.copy();
  const { x: Rx, y: Ry } = R.proj();
  const { x: Ox, y: Oy } = O.proj();
  expect(Rx).toBe(Ox);
  expect(Ry).toBe(Oy);

  const S = G.copy();
  const { x: Sx, y: Sy } = S.proj();
  const { x: Gx, y: Gy } = G.proj();
  expect(Sx).toBe(Gx);
  expect(Sy).toBe(Gy);
});

test("Q.G = O", () => {
  let QxG = G.copy().multiply(Q);
  expect(equals(QxG, O)).toBeTrue();
});

test("2G == G + G", () => {
  let G1 = G.copy().double();
  let G2 = G.copy().multiply(2n);
  let G3 = G.copy().increment(G);

  expect(equals(G1, G2)).toBeTrue();
  expect(equals(G2, G3)).toBeTrue();
  expect(equals(G1, G3)).toBeTrue();
});

test("8G == 2.2.2G", () => {
  let P = G.copy().double().double().double();
  let Q = G.copy().multiply(8n);

  expect(equals(P, Q)).toBeTrue();

  P.double();
  Q.increment(Q);

  expect(equals(P, Q)).toBeTrue();
});

test("aG + (Q-a)G = O", () => {
  for (let i = 0; i < 500; ++i) {
    const a = BigInt(i) + 8098234098230498234n;
    const A = G.copy().multiply(a);
    const B = G.copy().multiply(Q - a);
    A.increment(B);

    expect(equals(A, O)).toBeTrue();
  }
});

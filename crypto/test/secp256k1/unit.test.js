import { expect, test } from "bun:test";
import { equal } from "../../ellipticCurve";
import {
  G, O, Q,
  recoverSigner,
  sign,
  verify
} from "../../secp256k1";

test("copies of points are equal", () => {
  const P = G.copy();
  const Q = G.copy();
  expect(equal(P, G)).toBeTrue();
  expect(equal(P, Q)).toBeTrue();
});

test("`O` behaves as identity", () => {
  const P = G.copy().increment(O);
  expect(equal(P, G)).toBeTrue();

  const Q = O.copy().increment(G);
  expect(equal(Q, G)).toBeTrue();

  const R = O.copy().increment(O);
  expect(equal(R, O)).toBeTrue();

  const S = O.copy().double();
  expect(equal(S, O)).toBeTrue();

  const T = O.copy().multiply(5n);
  expect(equal(T, O)).toBeTrue();

  const U = O.copy().multiply(0n);
  expect(equal(U, O)).toBeTrue();

  const V = G.copy().multiply(0n);
  expect(equal(V, O)).toBeTrue();
});

test("G + O == G", () => {
  for (let i = 0; i < 1000; ++i) {
    const iG = G.copy().multiply(BigInt(i) + 1231283129313123123n);
    const iGG = iG.copy().increment(O);
    expect(equal(iG, iGG)).toBeTrue();
  }
});

test("A = B => proj(A) = proj(B)", () => {
  const OO = O.copy().project();
  expect(equal(OO, O)).toBeTrue();

  const GG = G.copy().project();
  expect(equal(GG, G)).toBeTrue();
});

test("N.G = O", () => {
  let nG = G.copy().multiply(Q);
  expect(equal(nG, O)).toBeTrue();
});

test("2G == G + G", () => {
  let G1 = G.copy().double();
  let G2 = G.copy().multiply(2n);
  let G3 = G.copy().increment(G);

  expect(equal(G1, G2)).toBeTrue();
  expect(equal(G2, G3)).toBeTrue();
  expect(equal(G1, G3)).toBeTrue();
});

test("8G == 2.2.2G", () => {
  let P = G.copy().double().double().double();
  let Q = G.copy().multiply(8n);

  expect(equal(P, Q)).toBeTrue();

  P.double();
  Q.increment(Q);

  expect(equal(P, Q)).toBeTrue();
});

test("aG + (Q-a)G = O", () => {
  for (let i = 0; i < 500; ++i) {
    const a = BigInt(i) + 8098234098230498234n;
    const A = G.copy().multiply(a);
    const B = G.copy().multiply(Q - a);
    A.increment(B);

    expect(equal(A, O)).toBeTrue();
  }
});

test("valid signatures are verified", () => {
  for (let z = 1n; z <= 100n; ++z) {
    const { r, s } = sign(z, 10n);
    expect(verify(z, r, s, G.copy().multiply(10n))).toBeTrue();
  }
  for (let pk = 1n; pk <= 100n; ++pk) {
    const { r, s } = sign(101n, pk);
    expect(verify(101n, r, s, G.copy().multiply(pk))).toBeTrue();
  }
  for (let i = 1n; i <= 100n; ++i) {
    const pk = i + 12938719237810238978787234n;
    const { r, s } = sign(808n, pk);
    expect(verify(808n, r, s, G.copy().multiply(pk))).toBeTrue();
  }
});

test("invalid signatures are rejected", () => {
  for (let z = 1n; z <= 100n; ++z) {
    const { r, s } = sign(z, 11n);
    expect(verify(z, r, s, G.copy().multiply(10n))).toBeFalse();
  }
  for (let pk = 1n; pk <= 100n; ++pk) {
    const { r, s } = sign(101n, pk);
    expect(verify(101n, r, s, G.copy().multiply(pk + 1n))).toBeFalse();
  }
  for (let z = 1n; z <= 100n; ++z) {
    const { r, s, yParity } = sign(z, 11n);
    const Q = recoverSigner(z, r, s, yParity);
    expect(equal(G.copy().multiply(10n), Q)).toBeFalse();
  }
});

test("valid signatures are verified", () => {
  for (let z = 1n; z <= 100n; ++z) {
    const { r, s, yParity } = sign(z, 10n);
    const Q = recoverSigner(z, r, s, yParity);
    expect(equal(G.copy().multiply(10n), Q)).toBeTrue();
  }
  for (let pk = 1n; pk <= 100n; ++pk) {
    const { r, s, yParity } = sign(101n, pk);
    const Q = recoverSigner(101n, r, s, yParity);
    expect(equal(G.copy().multiply(pk), Q));
  }
  for (let pk = 1n; pk <= 100n; ++pk) {
    const { r, s, yParity } = sign(101n, pk);
    const Q = recoverSigner(101n, r, s, yParity);
    expect(!equal(G.copy().multiply(pk + 1n), Q));
  }
  for (let i = 1n; i <= 100n; ++i) {
    const pk = i + 12938719237810238978787234n;
    const { r, s, yParity } = sign(808n, pk);
    const Q = recoverSigner(808n, r, s, yParity);
    expect(equal(G.copy().multiply(pk), Q));
  }
});

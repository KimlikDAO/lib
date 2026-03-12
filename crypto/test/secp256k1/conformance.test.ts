import { Point as NoblePoint } from "@noble/secp256k1";
import { describe, expect, it } from "bun:test";
import { G } from "../../secp256k1";

describe("Point <> JacobianPoint equivalence", () => {
  it("should be pointwise equal", () => {
    expect(G.proj()).toEqual(NoblePoint.BASE.toAffine());
  })
});

describe("Double tests", () => {
  const N = NoblePoint.BASE;
  it("should be pointwise equal", () => {
    expect(
      G.copy().double().proj()).toEqual(
        N.double().toAffine());
    expect(
      G.copy().double().double().proj()).toEqual(
        N.double().double().toAffine());
    expect(
      G.copy().double().double().double().proj()).toEqual(
        N.double().double().double().toAffine());
  })
});

describe("Add tests", () => {
  const N = NoblePoint.BASE;
  it("should be pointwise equal", () => {
    expect(
      G.copy().increment(G).proj()).toEqual(
        N.add(N).toAffine());
    expect(
      G.copy().increment(G).increment(G).proj()).toEqual(
        N.add(N).add(N).toAffine());
  })
});

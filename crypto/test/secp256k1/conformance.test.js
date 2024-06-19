import { ProjectivePoint } from "@noble/secp256k1";
import { describe, expect, it } from "bun:test";
import { G, Point } from "../../secp256k1";

/**
 * Remove the nobility of the point :/
 *
 * @param {!ProjectivePoint} p
 * @return {!Point}
 */
const derogate = (p) => {
  const q = p.toAffine();
  return new Point(q.x, q.y, 1n)
};

describe("Point <> JacobianPoint equivalence", () => {
  it("should be pointwise equal", () => {
    expect(G).toEqual(derogate(ProjectivePoint.BASE));
  })
});

describe("Double tests", () => {
  it("should be pointwise equal", () => {
    /** @const {!Point} */
    const nG = G.copy().double().project();

    expect(nG).toEqual(derogate(ProjectivePoint.BASE.double()));

    nG.double().project();
    expect(nG).toEqual(derogate(ProjectivePoint.BASE.double().double()));

    nG.double().project();
    expect(nG).toEqual(derogate(ProjectivePoint.BASE.double().double().double()));
  })
});

describe("Add tests", () => {
  it("should be pointwise equal", () => {
    /** @const {!Point} */
    const nG = G.copy().increment(G).project();
    expect(nG).toEqual(derogate(ProjectivePoint.BASE.add(ProjectivePoint.BASE)));

    nG.increment(G).project();
    expect(nG).toEqual(derogate(ProjectivePoint.BASE.add(ProjectivePoint.BASE).add(ProjectivePoint.BASE)));
  })
});

import { ProjectivePoint as NoblePoint } from "@noble/secp256k1";
import { describe, expect, it } from "bun:test";
import { G, Point } from "../../secp256k1";

/**
 * Remove the nobility of the point :/
 *
 * @param {!NoblePoint} p
 * @return {!Point}
 */
const derogate = (p) => {
  const q = p.toAffine();
  return new Point(q.x, q.y, 1n)
};

describe("Point <> JacobianPoint equivalence", () => {
  it("should be pointwise equal", () => {
    expect(G).toEqual(derogate(NoblePoint.BASE));
  })
});

describe("Double tests", () => {
  it("should be pointwise equal", () => {
    /** @const {!Point} */
    const nG = G.copy().double().project();

    expect(nG).toEqual(derogate(NoblePoint.BASE.double()));

    nG.double().project();
    expect(nG).toEqual(derogate(NoblePoint.BASE.double().double()));

    nG.double().project();
    expect(nG).toEqual(derogate(NoblePoint.BASE.double().double().double()));
  })
});

describe("Add tests", () => {
  it("should be pointwise equal", () => {
    /** @const {!Point} */
    const nG = G.copy().increment(G).project();
    expect(nG).toEqual(derogate(NoblePoint.BASE.add(NoblePoint.BASE)));

    nG.increment(G).project();
    expect(nG).toEqual(derogate(NoblePoint.BASE.add(NoblePoint.BASE).add(NoblePoint.BASE)));
  })
});

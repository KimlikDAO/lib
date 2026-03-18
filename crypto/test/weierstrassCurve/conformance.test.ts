import { expect, test } from "bun:test";
import bigints from "../../../util/bigints";
import { G as GArf } from "../../secp256k1";
import { G as GWts } from "./secp256k1";

test("Weierstrass secp256k1 matches Arf secp256k1 on random scalars", () => {
  for (let i = 0; i < 100; ++i) {
    const k = bigints.random(32);
    const A = GArf.copy().multiply(k).proj();
    const B = GWts.copy().multiply(k).proj();
    expect(A).toEqual(B);
  }
});

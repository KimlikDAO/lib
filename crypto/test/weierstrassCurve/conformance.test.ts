import { expect, test } from "bun:test";
import bigints from "../../../util/bigints";
import { G as G_arf } from "../../secp256k1";
import { G as G_wei } from "./secp256k1";

test("Weierstrass secp256k1 matches Arf secp256k1 on random scalars", () => {
  for (let i = 0; i < 100; ++i) {
    const k = bigints.random(256);
    const A = G_arf.copy().multiply(k).proj();
    const B = G_wei.copy().multiply(k).proj();
    expect(A).toEqual(B);
  }
});

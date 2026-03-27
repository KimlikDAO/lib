import { expect, test } from "bun:test";
import bigints from "../../../util/bigints";
import { G as G_arf } from "../../secp256k1";
import { G as G_wei, P } from "./secp256k1";

test("Weierstrass secp256k1 matches Arf secp256k1 on 100 points", () => {
  const scalars: bigint[] = [0n, P, P - 1n, P - 2n];
  for (let i = 0; i < 96; ++i)
    scalars.push(bigints.random(256));

  for (const k of scalars) {
    const A = G_arf.copy().multiply(k).proj();
    const B = G_wei.copy().multiply(k).proj();
    expect(A).toEqual(B);
  }
});

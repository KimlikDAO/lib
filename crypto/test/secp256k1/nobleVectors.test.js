import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { G } from "../../secp256k1";

describe("Noble crypto test vectors", () => {
  it("should match the results pointwise", () => readFile("crypto/test/secp256k1/nobleVectors.txt", "utf8")
    .then((/** @type {string} */ vectors) => {
      /** @const {number[][]} */
      const tuples = vectors.split("\n")
        .filter((line) => line)
        .map((line) => line.split(":"))

      for (const [priv, xHex, yHex] of tuples) {
        const { x, y } = G.copy().multiply(BigInt(priv)).project();
        expect(x).toBe(BigInt("0x" + xHex));
        expect(y).toBe(BigInt("0x" + yHex));
      }
    }))
});

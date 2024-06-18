import { readFile } from "node:fs/promises";
import { assertEq } from "../../../testing/assert";
import { G } from "../../secp256k1";

const testNobleVectors = () => readFile("crypto/test/secp256k1/nobleVectors.txt", "utf8")
  .then((/** string */ vectors) => {
    /** @const {!Array<!Array<number>>} */
    const tuples = vectors.split("\n")
      .filter((line) => line)
      .map((line) => line.split(":"))

    for (const [priv, xHex, yHex] of tuples) {
      const { x, y } = G.copy().multiply(BigInt(priv)).project();
      assertEq(x, BigInt("0x" + xHex));
      assertEq(y, BigInt("0x" + yHex));
    }
  });

testNobleVectors();

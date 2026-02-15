import { expect, test } from "bun:test";
import { G } from "../../crypto/secp256k1";
import { keccak256 } from "../../crypto/sha3";
import { pointToAddress, sign, signerAddress } from "../signer";

test("signerAddress(d, signCompact(d, s)) == pointToAddress(s.G)", () => {
  /** @const {string} */
  const digest = keccak256("sign me!");
  for (let /** @type {bigint} */ i = 1n; i < 100n; ++i)
    expect(signerAddress(digest, sign(digest, i)))
      .toBe(pointToAddress(G.copy().multiply(i).project()));
});

test("pointToAddress()", () => {
  expect(pointToAddress(G)).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
});

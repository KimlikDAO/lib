import { expect, test } from "bun:test";
import { G, signMessage, verifyMessage } from "../../minaSchnorr";

test("sign verify", () => {
  const { r, s } = signMessage("abc", 100n);
  const pubKey = G.copy().multiply(100n).project();
  expect(verifyMessage("abc", r, s, pubKey)).toBeTrue();
});

test("sign verify with pubKey hint", () => {
  const pubKey = G.copy().multiply(100n).project();
  const { r, s } = signMessage("abc", 100n, pubKey);
  expect(verifyMessage("abc", r, s, pubKey)).toBeTrue();
});

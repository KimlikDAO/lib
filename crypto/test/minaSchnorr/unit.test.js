import { expect, test } from "bun:test";
import { G, sign, verify } from "../../minaSchnorr";

test("sign verify", () => {
  const { r, s } = sign("abc", 100n);
  const pubKey = G.copy().multiply(100n).project();
  expect(verify("abc", r, s, pubKey)).toBeTrue();
});

test("sign verify with pubKey hint", () => {
  const pubKey = G.copy().multiply(100n).project();
  const { r, s } = sign("abc", 100n, pubKey);
  expect(verify("abc", r, s, pubKey)).toBeTrue();
});

import { expect, test } from "bun:test";
import { compressPoint } from "../../ellipticCurve";
import { G, signMessage, verifyMessage } from "../../minaSchnorr";

test("sign verify", () => {
  const { r, s } = signMessage("abc", 100n);
  const pubKey = compressPoint(G.copy().multiply(100n).proj());
  expect(verifyMessage("abc", r, s, pubKey)).toBeTrue();
});

test("sign verify with pubKey hint", () => {
  const A = G.copy().multiply(1337n).proj()
  const { r, s } = signMessage("abc", 1337n, A);
  expect(verifyMessage("abc", r, s, compressPoint(A))).toBeTrue();
});

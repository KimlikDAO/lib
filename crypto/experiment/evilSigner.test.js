import { expect, test } from "bun:test";
import { equal, G, recoverSigner } from "../secp256k1";
import { sign } from "./evilSigner.exp";

test("sign generates valid signatures", () => {
  const M = 0x13371337n;
  for (let digest = M; digest < M + 100n; ++digest)
    for (let privKey = M; privKey < M + 10n; ++privKey) {
      const { r, s, yParity } = sign(digest, privKey);
      const R = recoverSigner(digest, r, s, yParity);
      expect(equal(G.copy().multiply(privKey), R)).toBeTrue();
    }
});

test("sign generates RFC6979 compliant signatures on most inputs", () => {
});

import { signAsync } from "@noble/secp256k1";
import { expect, it } from "bun:test";
import bigints from "../../util/bigints";
import { sign as signEvil } from "./evilSigner";

it("generates RFC6979 compliant signatures on all 248 bit inputs", async () => {
  for (let d = 0; d < 100; ++d) {
    for (let privKey = 0; privKey < 10; ++privKey) {
      const privKeyBytes = new Uint8Array(32);
      privKeyBytes.set(/** @type {!Uint8Array} */(crypto.getRandomValues(new Uint8Array(31))), 1);
      const privKey = bigints.fromBytesBE(privKeyBytes);
      const digest = new Uint8Array(32);
      digest.set(/** @type {!Uint8Array} */(crypto.getRandomValues(new Uint8Array(31))), 1);

      const sig1 = await signAsync(digest, privKey, { lowS: true });
      const sig2 = await signEvil(digest, privKey);
      expect(sig1.r).toBe(sig2.r);
      expect(sig1.s).toBe(sig2.s);
      expect(sig1.recovery).toBe(+sig2.yParity);
    }
  }
});

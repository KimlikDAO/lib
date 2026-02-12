import { signAsync } from "@noble/secp256k1";
import { expect, it } from "bun:test";
import bigints from "../../util/bigints";
import { sign as signEvil } from "./evilSigner";

it("generates RFC6979 compliant signatures on all 248 bit inputs", async () => {
  for (let d = 0; d < 100; ++d) {
    for (let privKey = 0; privKey < 10; ++privKey) {
      const privKeyBytes = new Uint8Array(32);
      privKeyBytes.set(/** @type {Uint8Array} */(crypto.getRandomValues(new Uint8Array(31))), 1);
      const privKey = bigints.fromBytesBE(privKeyBytes);
      const digest = new Uint8Array(32);
      digest.set(/** @type {Uint8Array} */(crypto.getRandomValues(new Uint8Array(31))), 1);


      const sig1 = await signAsync(digest, privKeyBytes, { prehash: false, lowS: true, format: "recovered" });
      const sig2 = await signEvil(digest, privKey);
      const r1 = bigints.fromBytesBE(sig1.subarray(1, 33));
      const s1 = bigints.fromBytesBE(sig1.subarray(33, 65));
      expect(r1).toBe(sig2.r);
      expect(s1).toBe(sig2.s);
      expect(sig1[0]).toBe(+sig2.yParity);
    }
  }
}, { timeout: 10_000 });

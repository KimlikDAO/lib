import { describe, expect, test } from "bun:test";
import bytes from "../../../util/bytes";
import { hmacUint32 } from "../../sha2";

describe("HMAC-SHA256", () => {
  test("Compare against Web Crypto API", async () => {
    for (let i = 0; i < 100; ++i) {
      const n = 4 * ((Math.random() * 100) | 0 + 2);
      const key = /** @type {!Uint8Array} */(
        crypto.getRandomValues(new Uint8Array(32)));
      const data = /** @type {!Uint8Array} */(
        crypto.getRandomValues(new Uint8Array(n)));
      /** @const {!webCrypto.CryptoKey} */
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      /** @const {!ArrayBuffer} */
      const expected = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        data
      );
      const result = hmacUint32(
        bytes.toUint32ArrayBE(key), bytes.toUint32ArrayBE(data));
      expect(bytes.fromUint32ArrayBE(result).buffer)
        .toEqual(expected);
    }
  });
});

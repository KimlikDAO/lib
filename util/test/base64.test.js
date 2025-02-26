import { describe, expect, it } from "bun:test";
import base64 from "../base64";

describe("base64", () => {
  describe("from/toBytes", () => {
    it("should encode and decode basic strings", () => {
      const testCases = [
        new TextEncoder().encode("hello"),
        new TextEncoder().encode("test"),
        new TextEncoder().encode("abc")
      ];

      for (const bytes of testCases) {
        const encoded = base64.from(bytes);
        const decoded = base64.toBytes(encoded);
        expect(decoded).toEqual(bytes);
      }
    });

    it("should handle padding correctly", () => {
      // Test cases with different padding requirements
      const testCases = [
        { bytes: new Uint8Array([97, 98, 99]), base64: "YWJj" },     // No padding
        { bytes: new Uint8Array([97, 98]), base64: "YWI=" },         // One =
        { bytes: new Uint8Array([97]), base64: "YQ==" }              // Two ==
      ];

      for (const { bytes, base64: expected } of testCases) {
        expect(base64.from(bytes)).toBe(expected);
        expect(base64.toBytes(expected)).toEqual(bytes);
      }
    });
  });

  describe("BigInt conversion", () => {
    it("should convert BigInt to base64 and back", () => {
      const testCases = [
        0n,
        123456789n,
        0xFFFFFFn,
        0x123456789ABCDEFn,
        BigInt(Number.MAX_SAFE_INTEGER)
      ];

      for (const n of testCases) {
        const encoded = base64.fromBigInt(n);
        const decoded = base64.toBigInt(encoded);
        expect(decoded).toBe(n);
      }
    });

    it("should handle specific known cases", () => {
      const testCases = [
        { input: 0xFFn, base64: "/w==" },
        { input: 0xFFFFn, base64: "//8=" },
        { input: 0x12345n, base64: "ASNF" }
      ];

      for (const { input, base64: expected } of testCases) {
        expect(base64.fromBigInt(input)).toBe(expected);
        expect(base64.toBigInt(expected)).toBe(input);
      }
    });

    it("should handle edge cases", () => {
      // Test single byte values
      for (let n = 0n; n < 10000n; ++n) {
        const encoded = base64.fromBigInt(n);
        const decoded = base64.toBigInt(encoded);
        expect(decoded).toBe(n);
      }
    });
  });
});

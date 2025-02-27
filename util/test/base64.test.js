import { describe, expect, it } from "bun:test";
import base64 from "../base64";

describe("base64.from", () => {
  it("should encode bytes to base64", () => {
    const testCases = [
      { input: new Uint8Array([]), expected: "" },
      { input: new Uint8Array([104, 101, 108, 108, 111]), expected: "aGVsbG8=" },  // "hello"
      { input: new Uint8Array([116, 101, 115, 116]), expected: "dGVzdA==" },       // "test"
      { input: new Uint8Array([0xFF, 0x00, 0xFF]), expected: "/wD/" }
    ];

    for (const { input, expected } of testCases) {
      expect(base64.from(input)).toBe(expected);
    }
  });
});

describe("base64.toBytes", () => {
  it("should decode base64 to bytes", () => {
    const testCases = [
      { input: "", expected: new Uint8Array([]) },
      { input: "aGVsbG8=", expected: new Uint8Array([104, 101, 108, 108, 111]) },  // "hello"
      { input: "dGVzdA==", expected: new Uint8Array([116, 101, 115, 116]) },       // "test"
      { input: "/wD/", expected: new Uint8Array([0xFF, 0x00, 0xFF]) }
    ];

    for (const { input, expected } of testCases) {
      expect(base64.toBytes(input)).toEqual(expected);
    }
  });
});

describe("base64.intoBytes", () => {
  it("should decode base64 into existing buffer", () => {
    const testCases = [
      { input: "aGVsbG8=", length: 5 },  // "hello"
      { input: "dGVzdA==", length: 4 },  // "test"
      { input: "/wD/", length: 3 }
    ];

    for (const { input, length } of testCases) {
      const buffer = new Uint8Array(length);
      base64.intoBytes(buffer, input);
      expect(buffer).toEqual(base64.toBytes(input));
    }
  });
});

describe("base64.fromBigInt", () => {
  it("should encode BigInts to base64", () => {
    const testCases = [
      { input: 0n, expected: "AA==" },
      { input: 255n, expected: "/w==" },
      { input: 256n, expected: "AQA=" },
      { input: 0x123456n, expected: "EjRW" }
    ];

    for (const { input, expected } of testCases) {
      expect(base64.fromBigInt(input)).toBe(expected);
    }
  });
});

describe("base64.toBigInt", () => {
  it("should decode base64 to BigInt", () => {
    const testCases = [
      { input: "AA==", expected: 0n },
      { input: "/w==", expected: 255n },
      { input: "AQA=", expected: 256n },
      { input: "EjRW", expected: 0x123456n }
    ];

    for (const { input, expected } of testCases) {
      expect(base64.toBigInt(input)).toBe(expected);
    }
  });
});

describe("round trip conversions", () => {
  it("should preserve bytes through base64 conversion", () => {
    const testCases = [
      new Uint8Array([]),
      new Uint8Array([0]),
      new Uint8Array([255]),
      new Uint8Array([1, 2, 3, 4, 5]),
      new Uint8Array([0xFF, 0x00, 0xFF, 0x00])
    ];

    for (const bytes of testCases) {
      const encoded = base64.from(bytes);
      const decoded = base64.toBytes(encoded);
      expect(decoded).toEqual(bytes);
    }
  });

  it("should preserve BigInts through base64 conversion", () => {
    const testValues = [
      0n,
      1n,
      255n,
      256n,
      0x1234n,
      0x123456n,
      0x12345678n,
      0x123456789An,
      0x123456789ABCDEFn
    ];

    for (const value of testValues) {
      const encoded = base64.fromBigInt(value);
      const decoded = base64.toBigInt(encoded);
      expect(decoded).toBe(value);
    }
  });
});

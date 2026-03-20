import { describe, expect, it } from "bun:test";
import hash from "../hash";

const Max48 = 2 ** 48 - 1;

describe("hash.toStr", () => {
  it("encodes 48-bit integers as 8-character base64url strings", () => {
    expect(hash.toStr(0)).toBe("AAAAAAAA");
    expect(hash.toStr(1)).toBe("AAAAAAAB");
    expect(hash.toStr(64)).toBe("AAAAAABA");
    expect(hash.toStr(64 ** 7)).toBe("BAAAAAAA");
    expect(hash.toStr(Max48)).toBe("________");
  });
});

describe("hash.fromStrHash", () => {
  it("decodes base64url strings back to the original integer", () => {
    expect(hash.fromStrHash("AAAAAAAA")).toBe(0);
    expect(hash.fromStrHash("AAAAAAAB")).toBe(1);
    expect(hash.fromStrHash("AAAAAABA")).toBe(64);
    expect(hash.fromStrHash("BAAAAAAA")).toBe(64 ** 7);
    expect(hash.fromStrHash("________")).toBe(Max48);
  });

  it("rejects invalid strings", () => {
    expect(hash.fromStrHash("AAAAAAA")).toBe(-1);
    expect(hash.fromStrHash("AAAAAAAAA")).toBe(-1);
    expect(hash.fromStrHash("AAAAAAA+")).toBe(-1);
    expect(hash.fromStrHash("AAAAAAA=")).toBe(-1);
    expect(hash.fromStrHash("AAAAAAA!")).toBe(-1);
    expect(hash.fromStrHash("AAAAAAA~")).toBe(-1);
  });
});

describe("hash round trip", () => {
  it("round-trips representative values", () => {
    for (const value of [0, 1, 63, 64, 4095, 4096, 64 ** 7, 0x123456789abc, Max48])
      expect(hash.fromStrHash(hash.toStr(value))).toBe(value);
  });
});

import { describe, expect, it } from "bun:test";
import base64 from "../base64";

describe("base64.from", () => {
  it("encodes bytes to base64", () => {
    expect(base64.from(new Uint8Array([]))).toBe("");
    expect(base64.from(new Uint8Array([104, 101, 108, 108, 111]))).toBe("aGVsbG8=");
    expect(base64.from(new Uint8Array([116, 101, 115, 116]))).toBe("dGVzdA==");
    expect(base64.from(new Uint8Array([0xff, 0x00, 0xff]))).toBe("/wD/");
  });
});

describe("base64.toBytes", () => {
  it("decodes base64 to bytes", () => {
    expect(base64.toBytes("")).toEqual(new Uint8Array([]));
    expect(base64.toBytes("aGVsbG8=")).toEqual(
      new Uint8Array([104, 101, 108, 108, 111]),
    );
    expect(base64.toBytes("dGVzdA==")).toEqual(new Uint8Array([116, 101, 115, 116]));
    expect(base64.toBytes("/wD/")).toEqual(new Uint8Array([0xff, 0x00, 0xff]));
  });
});

describe("base64.intoBytes", () => {
  it("decodes base64 into an existing buffer", () => {
    const a = new Uint8Array(5);
    base64.intoBytes(a, "aGVsbG8=");
    expect(a).toEqual(base64.toBytes("aGVsbG8="));

    const b = new Uint8Array(4);
    base64.intoBytes(b, "dGVzdA==");
    expect(b).toEqual(base64.toBytes("dGVzdA=="));

    const c = new Uint8Array(3);
    base64.intoBytes(c, "/wD/");
    expect(c).toEqual(base64.toBytes("/wD/"));
  });
});

describe("base64.fromBigInt", () => {
  it("encodes bigint to base64", () => {
    expect(base64.fromBigInt(0n)).toBe("AA==");
    expect(base64.fromBigInt(255n)).toBe("/w==");
    expect(base64.fromBigInt(256n)).toBe("AQA=");
    expect(base64.fromBigInt(0x123456n)).toBe("EjRW");
  });
});

describe("base64.toBigInt", () => {
  it("decodes base64 to bigint", () => {
    expect(base64.toBigInt("AA==")).toBe(0n);
    expect(base64.toBigInt("/w==")).toBe(255n);
    expect(base64.toBigInt("AQA=")).toBe(256n);
    expect(base64.toBigInt("EjRW")).toBe(0x123456n);
  });
});

describe("round trip", () => {
  it("bytes → base64 → bytes", () => {
    expect(base64.toBytes(base64.from(new Uint8Array([]))))
      .toEqual(new Uint8Array([]));
    expect(base64.toBytes(base64.from(new Uint8Array([0]))))
      .toEqual(new Uint8Array([0]));
    expect(base64.toBytes(base64.from(new Uint8Array([255]))))
      .toEqual(new Uint8Array([255]));
    expect(base64.toBytes(base64.from(new Uint8Array([1, 2, 3, 4, 5]))))
      .toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(base64.toBytes(base64.from(new Uint8Array([0xff, 0x00, 0xff, 0x00]))))
      .toEqual(new Uint8Array([0xff, 0x00, 0xff, 0x00]));
  });

  it("bigint → base64 → bigint", () => {
    expect(base64.toBigInt(base64.fromBigInt(0n))).toBe(0n);
    expect(base64.toBigInt(base64.fromBigInt(1n))).toBe(1n);
    expect(base64.toBigInt(base64.fromBigInt(255n))).toBe(255n);
    expect(base64.toBigInt(base64.fromBigInt(256n))).toBe(256n);
    expect(base64.toBigInt(base64.fromBigInt(0x1234n))).toBe(0x1234n);
    expect(base64.toBigInt(base64.fromBigInt(0x123456n))).toBe(0x123456n);
    expect(base64.toBigInt(base64.fromBigInt(0x12345678n))).toBe(0x12345678n);
    expect(base64.toBigInt(base64.fromBigInt(0x123456789an))).toBe(0x123456789an);
    expect(base64.toBigInt(base64.fromBigInt(0x123456789abcdefn)))
      .toBe(0x123456789abcdefn);
  });
});

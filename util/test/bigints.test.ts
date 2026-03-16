import { describe, expect, it } from "bun:test";
import bigints from "../bigints";

describe("intoBytesBE", () => {
  it("writes at correct index", () => {
    const buff = new Uint8Array(8);
    bigints.intoBytesBE(buff, 1234567890n, 8);
    expect(buff).toEqual(new Uint8Array([0, 0, 0, 0, 73, 150, 2, 210]));
  });

  it("big-endian widths", () => {
    const buff32 = new Uint8Array(4);
    bigints.intoBytesBE(buff32, 0x12345678n, 4);
    expect(buff32).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));

    const buff16 = new Uint8Array(2);
    bigints.intoBytesBE(buff16, 0xabcdn, 2);
    expect(buff16).toEqual(new Uint8Array([0xab, 0xcd]));

    const buff64 = new Uint8Array(8);
    bigints.intoBytesBE(buff64, 0x123456789abcdef0n, 8);
    expect(buff64).toEqual(
      new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
    );

    const buff24 = new Uint8Array(3);
    bigints.intoBytesBE(buff24, 0x123456n, 3);
    expect(buff24).toEqual(new Uint8Array([0x12, 0x34, 0x56]));
  });

  it("edge cases", () => {
    const buff0 = new Uint8Array(1);
    bigints.intoBytesBE(buff0, 0n, 1);
    expect(buff0).toEqual(new Uint8Array([0]));

    const buff255 = new Uint8Array(1);
    bigints.intoBytesBE(buff255, 255n, 1);
    expect(buff255).toEqual(new Uint8Array([255]));

    const buffSmall = new Uint8Array(4);
    bigints.intoBytesBE(buffSmall, 0x12n, 4);
    expect(buffSmall).toEqual(new Uint8Array([0, 0, 0, 0x12]));
  });

  it("leading zeros", () => {
    const a = new Uint8Array(2);
    bigints.intoBytesBE(a, 0x0012n, 2);
    expect(a).toEqual(new Uint8Array([0x00, 0x12]));

    const b = new Uint8Array(3);
    bigints.intoBytesBE(b, 0x000789n, 3);
    expect(b).toEqual(new Uint8Array([0x00, 0x07, 0x89]));

    const c = new Uint8Array(4);
    bigints.intoBytesBE(c, 0x00000042n, 4);
    expect(c).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x42]));
  });
});

describe("intoBytesLE", () => {
  it("little-endian", () => {
    const buff = new Uint8Array(4);
    bigints.intoBytesLE(buff, 1234567890n);
    expect(buff).toEqual(new Uint8Array([210, 2, 150, 73]));
  });

  it("various widths", () => {
    const buff32 = new Uint8Array(4);
    bigints.intoBytesLE(buff32, 0x12345678n);
    expect(buff32).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));

    const buff16 = new Uint8Array(2);
    bigints.intoBytesLE(buff16, 0xabcdn);
    expect(buff16).toEqual(new Uint8Array([0xcd, 0xab]));

    const buff64 = new Uint8Array(8);
    bigints.intoBytesLE(buff64, 0x123456789abcdef0n);
    expect(buff64).toEqual(
      new Uint8Array([0xf0, 0xde, 0xbc, 0x9a, 0x78, 0x56, 0x34, 0x12]),
    );
  });

  it("edge cases", () => {
    const buff0 = new Uint8Array(1);
    bigints.intoBytesLE(buff0, 0n);
    expect(buff0).toEqual(new Uint8Array([0]));

    const buff255 = new Uint8Array(1);
    bigints.intoBytesLE(buff255, 255n);
    expect(buff255).toEqual(new Uint8Array([255]));

    const buff256 = new Uint8Array(2);
    bigints.intoBytesLE(buff256, 256n);
    expect(buff256).toEqual(new Uint8Array([0, 1]));

    const buff257 = new Uint8Array(2);
    bigints.intoBytesLE(buff257, 257n);
    expect(buff257).toEqual(new Uint8Array([1, 1]));
  });

  it("odd-length hex", () => {
    const buff = new Uint8Array(2);
    bigints.intoBytesLE(buff, 0x123n);
    expect(buff).toEqual(new Uint8Array([0x23, 0x01]));
  });
});

describe("fromBytesBE", () => {
  it("bytes to bigint", () => {
    expect(bigints.fromBytesBE(new Uint8Array([0]))).toBe(0n);
    expect(bigints.fromBytesBE(new Uint8Array([255]))).toBe(255n);
    expect(bigints.fromBytesBE(new Uint8Array([0x12, 0x34]))).toBe(0x1234n);
    expect(bigints.fromBytesBE(new Uint8Array([0x12, 0x34, 0x56]))).toBe(
      0x123456n,
    );
    expect(
      bigints.fromBytesBE(new Uint8Array([0x12, 0x34, 0x56, 0x78])),
    ).toBe(0x12345678n);
  });
});

describe("fromBytesLE", () => {
  it("bytes to bigint", () => {
    expect(bigints.fromBytesLE(new Uint8Array([0]))).toBe(0n);
    expect(bigints.fromBytesLE(new Uint8Array([255]))).toBe(255n);
    expect(bigints.fromBytesLE(new Uint8Array([0x34, 0x12]))).toBe(0x1234n);
    expect(bigints.fromBytesLE(new Uint8Array([0x56, 0x34, 0x12]))).toBe(
      0x123456n,
    );
    expect(
      bigints.fromBytesLE(new Uint8Array([0x78, 0x56, 0x34, 0x12])),
    ).toBe(0x12345678n);
  });

  it("edge cases", () => {
    expect(bigints.fromBytesLE(new Uint8Array([0]))).toBe(0n);
    expect(bigints.fromBytesLE(new Uint8Array([1]))).toBe(1n);
    expect(bigints.fromBytesLE(new Uint8Array([255]))).toBe(255n);
    expect(
      bigints.fromBytesLE(
        new Uint8Array([0xf0, 0xde, 0xbc, 0x9a, 0x78, 0x56, 0x34, 0x12]),
      ),
    ).toBe(0x123456789abcdef0n);
  });
});

describe("round trip", () => {
  const beValues: bigint[] = [
    0n,
    1n,
    255n,
    256n,
    0x1234n,
    0x123456n,
    0x12345678n,
    0x123456789an,
    0x123456789abcdefn,
  ];

  it("BE round trip", () => {
    for (const value of beValues) {
      const bytes = new Uint8Array(Math.ceil(value.toString(16).length / 2));
      bigints.intoBytesBE(bytes, value, bytes.length);
      expect(bigints.fromBytesBE(bytes)).toBe(value);
    }
  });

  it("LE round trip", () => {
    for (const value of beValues) {
      const bytes = new Uint8Array(Math.ceil(value.toString(16).length / 2));
      bigints.intoBytesLE(bytes, value);
      expect(bigints.fromBytesLE(bytes)).toBe(value);
    }
  });
});

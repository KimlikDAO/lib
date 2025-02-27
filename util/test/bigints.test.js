import { describe, expect, it } from "bun:test";
import bigints from "../bigints";

describe("intoBytesBE", () => {
  it("should write in correct index", () => {
    const buff = new Uint8Array(8);
    bigints.intoBytesBE(buff, 8, 1234567890n);
    expect(buff).toEqual(new Uint8Array([0, 0, 0, 0, 73, 150, 2, 210]));
  });

  it("should correctly convert big-endian", () => {
    // Test with a 32-bit number
    const buff32 = new Uint8Array(4);
    bigints.intoBytesBE(buff32, 4, 0x12345678n);
    expect(buff32).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));

    // Test with a 16-bit number
    const buff16 = new Uint8Array(2);
    bigints.intoBytesBE(buff16, 2, 0xABCDn);
    expect(buff16).toEqual(new Uint8Array([0xAB, 0xCD]));

    // Test with a 64-bit number
    const buff64 = new Uint8Array(8);
    bigints.intoBytesBE(buff64, 8, 0x123456789ABCDEF0n);
    expect(buff64).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0]));

    // Test with an odd number of bytes (3 bytes for 24 bits)
    const buff24 = new Uint8Array(3);
    bigints.intoBytesBE(buff24, 3, 0x123456n);
    expect(buff24).toEqual(new Uint8Array([0x12, 0x34, 0x56]));
  });

  it("should handle edge cases", () => {
    // Test zero
    const buff0 = new Uint8Array(1);
    bigints.intoBytesBE(buff0, 1, 0n);
    expect(buff0).toEqual(new Uint8Array([0]));

    // Test max value for 8 bits
    const buff255 = new Uint8Array(1);
    bigints.intoBytesBE(buff255, 1, 255n);
    expect(buff255).toEqual(new Uint8Array([255]));

    // Test number smaller than buffer
    const buffSmall = new Uint8Array(4);
    bigints.intoBytesBE(buffSmall, 4, 0x12n);
    expect(buffSmall).toEqual(new Uint8Array([0, 0, 0, 0x12]));
  });

  it("should handle leading zeros", () => {
    const testCases = [
      { size: 2, value: 0x0012n, expected: [0x00, 0x12] },
      { size: 3, value: 0x000789n, expected: [0x00, 0x07, 0x89] },
      { size: 4, value: 0x00000042n, expected: [0x00, 0x00, 0x00, 0x42] }
    ];

    for (const { size, value, expected } of testCases) {
      const buff = new Uint8Array(size);
      bigints.intoBytesBE(buff, size, value);
      expect(buff).toEqual(new Uint8Array(expected));
    }
  });
});

describe("intoBytesLE", () => {
  it("should write in little-endian order", () => {
    const buff = new Uint8Array(4);
    bigints.intoBytesLE(buff, 1234567890n);
    expect(buff).toEqual(new Uint8Array([210, 2, 150, 73]));
  });

  it("should correctly convert various sizes", () => {
    // Test with a 32-bit number
    const buff32 = new Uint8Array(4);
    bigints.intoBytesLE(buff32, 0x12345678n);
    expect(buff32).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));

    // Test with a 16-bit number
    const buff16 = new Uint8Array(2);
    bigints.intoBytesLE(buff16, 0xABCDn);
    expect(buff16).toEqual(new Uint8Array([0xCD, 0xAB]));

    // Test with a 64-bit number
    const buff64 = new Uint8Array(8);
    bigints.intoBytesLE(buff64, 0x123456789ABCDEF0n);
    expect(buff64).toEqual(new Uint8Array([0xF0, 0xDE, 0xBC, 0x9A, 0x78, 0x56, 0x34, 0x12]));
  });

  it("should handle edge cases", () => {
    // Test zero
    const buff0 = new Uint8Array(1);
    bigints.intoBytesLE(buff0, 0n);
    expect(buff0).toEqual(new Uint8Array([0]));

    // Test max value for 8 bits
    const buff255 = new Uint8Array(1);
    bigints.intoBytesLE(buff255, 255n);
    expect(buff255).toEqual(new Uint8Array([255]));

    // Test 16-bit values
    const buff256 = new Uint8Array(2);
    bigints.intoBytesLE(buff256, 256n);
    expect(buff256).toEqual(new Uint8Array([0, 1]));

    const buff257 = new Uint8Array(2);
    bigints.intoBytesLE(buff257, 257n);
    expect(buff257).toEqual(new Uint8Array([1, 1]));
  });

  it("should handle odd-length hex strings", () => {
    // Test number that produces odd-length hex string
    const buff = new Uint8Array(2);
    bigints.intoBytesLE(buff, 0x123n); // "123" is odd length
    expect(buff).toEqual(new Uint8Array([0x23, 0x01]));
  });
});

describe("fromBytesBE", () => {
  it("should convert bytes back to BigInt", () => {
    const testCases = [
      { value: 0n, bytes: new Uint8Array([0]) },
      { value: 255n, bytes: new Uint8Array([255]) },
      { value: 0x1234n, bytes: new Uint8Array([0x12, 0x34]) },
      { value: 0x123456n, bytes: new Uint8Array([0x12, 0x34, 0x56]) },
      { value: 0x12345678n, bytes: new Uint8Array([0x12, 0x34, 0x56, 0x78]) }
    ];

    for (const { value, bytes } of testCases) {
      expect(bigints.fromBytesBE(bytes)).toBe(value);
    }
  });
});

describe("fromBytesLE", () => {
  it("should convert little-endian bytes to BigInt", () => {
    const testCases = [
      { value: 0n, bytes: new Uint8Array([0]) },
      { value: 255n, bytes: new Uint8Array([255]) },
      { value: 0x1234n, bytes: new Uint8Array([0x34, 0x12]) },
      { value: 0x123456n, bytes: new Uint8Array([0x56, 0x34, 0x12]) },
      { value: 0x12345678n, bytes: new Uint8Array([0x78, 0x56, 0x34, 0x12]) }
    ];

    for (const { value, bytes } of testCases) {
      expect(bigints.fromBytesLE(bytes)).toBe(value);
    }
  });

  it("should handle edge cases", () => {
    // Single byte values
    expect(bigints.fromBytesLE(new Uint8Array([0]))).toBe(0n);
    expect(bigints.fromBytesLE(new Uint8Array([1]))).toBe(1n);
    expect(bigints.fromBytesLE(new Uint8Array([255]))).toBe(255n);

    // Large numbers
    const bytes = new Uint8Array([0xF0, 0xDE, 0xBC, 0x9A, 0x78, 0x56, 0x34, 0x12]);
    expect(bigints.fromBytesLE(bytes)).toBe(0x123456789ABCDEF0n);
  });
});

describe("round trip conversions", () => {
  it("should preserve values through BE conversions", () => {
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
      const bytes = new Uint8Array(Math.ceil(value.toString(16).length / 2));
      bigints.intoBytesBE(bytes, bytes.length, value);
      expect(bigints.fromBytesBE(bytes)).toBe(value);
    }
  });

  it("should preserve values through LE conversions", () => {
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
      const bytes = new Uint8Array(Math.ceil(value.toString(16).length / 2));
      bigints.intoBytesLE(bytes, value);
      expect(bigints.fromBytesLE(bytes)).toBe(value);
    }
  });
});

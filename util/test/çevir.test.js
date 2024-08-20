import { describe, expect, it, test } from "bun:test";
import {
  base64tenSayıya,
  hex,
  hexten,
  sayıdanBase64e,
  uint32ArrayeHexten,
  uint8ArrayBEyeSayıdan,
  uint8ArrayeHexten,
  uint8ArrayLEyeSayıdan,
} from "../çevir";

test("hex conversion tests", () => {
  expect(hex(Uint8Array.from([]))).toBe("");
  expect(hex(Uint8Array.from([1, 2, 3]))).toBe("010203");
  expect(hex(Uint8Array.from([255, 255, 255]))).toBe("ffffff");
});

test("hexten conversion tests", () => {
  expect(hexten("")).toEqual(Uint8Array.from([]));
  expect(hexten("a")).toEqual(Uint8Array.from([10]));
  expect(hexten("ab")).toEqual(Uint8Array.from([171]));
  expect(hexten("abc")).toEqual(Uint8Array.from([10, 188]));
});

test("Uint8Array extended hexten tests", () => {
  const buff = Uint8Array.from([10, 10, 10, 10, 10, 10]);
  uint8ArrayeHexten(buff, "");
  expect(buff).toEqual(Uint8Array.from([10, 10, 10, 10, 10, 10]));
  uint8ArrayeHexten(buff, "A0B0C");
  expect(buff).toEqual(Uint8Array.from([10, 11, 12, 10, 10, 10]));
  uint8ArrayeHexten(buff.subarray(3), "FFFF");
  expect(buff).toEqual(Uint8Array.from([10, 11, 12, 255, 255, 10]));
});

test("Uint32Array extended hexten tests", () => {
  const buff = Uint32Array.from([2, 2, 2, 2]);
  uint32ArrayeHexten(buff, "00000001");
  expect(buff).toEqual(Uint32Array.from([1, 2, 2, 2]));
  uint32ArrayeHexten(buff, "10000000");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 2, 2, 2]));
  uint32ArrayeHexten(buff, "100000001");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 1, 2, 2]));
  uint32ArrayeHexten(buff, "1000000000000001");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 1, 2, 2]));
  uint32ArrayeHexten(buff, "10000000000000001");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 0, 1, 2]));
});

it("should convert binary to hex", () => {
  expect(hex(Uint8Array.from([1, 2, 3]))).toBe("010203");
});

it("should convert hex to binary", () => {
  expect(hexten("010203")).toEqual(Uint8Array.from([1, 2, 3]));
});

it("should handle missing leading zero", () => {
  expect(hexten("10203")).toEqual(Uint8Array.from([1, 2, 3]));
});

describe("uint8ArrayeSayıdan", () => {
  test("uint8ArrayLEyeSayıdan should convert 0 to [0]", () => {
    const buff = new Uint8Array(1);
    uint8ArrayLEyeSayıdan(buff, 0n);
    expect(buff).toEqual(new Uint8Array([0]));
  });

  test("uint8ArrayLEyeSayıdan should convert 255 to [255]", () => {
    const buff = new Uint8Array(1);
    uint8ArrayLEyeSayıdan(buff, 255n);
    expect(buff).toEqual(new Uint8Array([255]));
  });

  test("uint8ArrayLEyeSayıdan should convert 256 to [0, 1]", () => {
    const buff = new Uint8Array(2);
    uint8ArrayLEyeSayıdan(buff, 256n);
    expect(buff).toEqual(new Uint8Array([0, 1]));
  });

  test("uint8ArrayLEyeSayıdan should handle odd-length hex strings", () => {
    const buff = new Uint8Array(2);
    uint8ArrayLEyeSayıdan(buff, BigInt(257)); // 101 in hex, which is odd length
    expect(buff).toEqual(new Uint8Array([1, 1]));

    const buff2 = new Uint8Array(4);
    uint8ArrayLEyeSayıdan(buff2, 1234567890n);
    expect(buff2).toEqual(new Uint8Array([210, 2, 150, 73]));
  });
});

describe("uint8ArrayBEyeSayıdan", () => {
  it("should write in correct index", () => {
    const buff2 = new Uint8Array(8);
    uint8ArrayBEyeSayıdan(buff2, 8, 1234567890n);
    expect(buff2).toEqual(new Uint8Array([0, 0, 0, 0, 73, 150, 2, 210]));
  })

  it("should correctly convert big-endian", () => {
    // Test with a 32-bit number
    const buff = new Uint8Array(4);
    uint8ArrayBEyeSayıdan(buff, 4, 0x12345678n);
    expect(buff).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));

    // Test with a 16-bit number
    const buff16 = new Uint8Array(2);
    uint8ArrayBEyeSayıdan(buff16, 2, 0xABCDn);
    expect(buff16).toEqual(new Uint8Array([0xAB, 0xCD]));

    // Test with a 64-bit number
    const buff64 = new Uint8Array(8);
    uint8ArrayBEyeSayıdan(buff64, 8, 0x123456789ABCDEF0n);
    expect(buff64).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0]));

    // Test with an odd number of bytes (3 bytes for 24 bits)
    const buff24 = new Uint8Array(3);
    uint8ArrayBEyeSayıdan(buff24, 3, 0x123456n);
    expect(buff24).toEqual(new Uint8Array([0x12, 0x34, 0x56]));
  });

  it("should handle zero", () => {
    const buff = new Uint8Array(1);
    uint8ArrayBEyeSayıdan(buff, 1, 0n);
    expect(buff).toEqual(new Uint8Array([0]));
  });

  it("should handle the maximum value for 8 bits", () => {
    const buff = new Uint8Array(1);
    uint8ArrayBEyeSayıdan(buff, 1, 255n);
    expect(buff).toEqual(new Uint8Array([255]));
  });
});

describe("BigInt serialization", () => {
  test("base64TenSayıya(sayıdanBase64E(n)) == n", () => {
    for (let i = 1n; i < 1000n; ++i)
      expect(base64tenSayıya(sayıdanBase64e(i))).toBe(i);
  })
});

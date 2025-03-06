import { describe, expect, it } from "bun:test";
import hex from "../hex";

describe("hex.from", () => {
  it("should convert bytes to hex string", () => {
    expect(hex.from(new Uint8Array([]))).toBe("");
    expect(hex.from(new Uint8Array([1, 2, 3]))).toBe("010203");
    expect(hex.from(new Uint8Array([255, 255, 255]))).toBe("ffffff");
    expect(hex.from(new Uint8Array([0x12, 0x34, 0x56]))).toBe("123456");
  });
});

describe("hex.fromBytesLE", () => {
  it("should convert bytes to hex string in little-endian order", () => {
    expect(hex.fromBytesLE(new Uint8Array([0x12, 0x34]))).toBe("3412");
    expect(hex.fromBytesLE(new Uint8Array([0x12, 0x34, 0x56]))).toBe("563412");
    expect(hex.fromBytesLE(new Uint8Array([]))).toBe("");
  });
});

describe("hex.fromUint32ArrayBE", () => {
  it("should convert Uint32Array to hex string in big-endian order", () => {
    expect(hex.fromUint32ArrayBE(new Uint32Array([]))).toBe("");
    expect(hex.fromUint32ArrayBE(new Uint32Array([0x01020304]))).toBe("01020304");
    expect(hex.fromUint32ArrayBE(new Uint32Array([0x01020304, 0x05060708]))).toBe("0102030405060708");
    expect(hex.fromUint32ArrayBE(new Uint32Array([0xffffffff]))).toBe("ffffffff");
    expect(hex.fromUint32ArrayBE(new Uint32Array([0xdeadbeef]))).toBe("deadbeef");
    expect(hex.fromUint32ArrayBE(new Uint32Array([0x00000000, 0xffffffff]))).toBe("00000000ffffffff");

    const shaOutput = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    expect(hex.fromUint32ArrayBE(shaOutput)).toBe(
      "6a09e667bb67ae853c6ef372a54ff53a510e527f9b05688c1f83d9ab5be0cd19"
    );
  });
});

describe("hex.toUint8Array", () => {
  it("should convert hex string to bytes", () => {
    expect(hex.toUint8Array("")).toEqual(new Uint8Array([]));
    expect(hex.toUint8Array("010203")).toEqual(new Uint8Array([1, 2, 3]));
    expect(hex.toUint8Array("ffffff")).toEqual(new Uint8Array([255, 255, 255]));
  });

  it("should handle case-insensitive input", () => {
    expect(hex.toUint8Array("aAbBcC")).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]));
    expect(hex.toUint8Array("AABBCC")).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]));
  });

  it("should handle odd-length input by padding with 0", () => {
    expect(hex.toUint8Array("1")).toEqual(new Uint8Array([1]));
    expect(hex.toUint8Array("123")).toEqual(new Uint8Array([0x01, 0x23]));
  });
});

describe("hex.intoUint8Array", () => {
  it("should write hex string into existing buffer", () => {
    const buff = new Uint8Array(3);
    hex.intoBytes(buff, "010203");
    expect(buff).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("should handle odd-length input", () => {
    const buff = new Uint8Array(2);
    hex.intoBytes(buff, "123");
    expect(buff).toEqual(new Uint8Array([0x01, 0x23]));
  });
});

describe("hex.intoUint32ArrayBE", () => {
  it("should write hex string into Uint32Array in big-endian order", () => {
    const buff = new Uint32Array(4);
    buff.fill(2); // Initialize with 2s

    // Test single 32-bit word
    hex.intoUint32ArrayBE(buff, 1, "00000001");
    expect(buff).toEqual(new Uint32Array([1, 2, 2, 2]));

    // Test larger number
    hex.intoUint32ArrayBE(buff, 1, "10000000");
    expect(buff).toEqual(new Uint32Array([0x10000000, 2, 2, 2]));

    // Test multiple words
    hex.intoUint32ArrayBE(buff, 2, "0000000100000002");
    expect(buff).toEqual(new Uint32Array([1, 2, 2, 2]));

    // Test full buffer
    hex.intoUint32ArrayBE(buff, 4, "0000000100000002000000030000000f");
    expect(buff).toEqual(new Uint32Array([1, 2, 3, 15]));
  });
});

describe("hex.toBinary", () => {
  it("should convert hex to binary string", () => {
    expect(hex.toBinary("0")).toBe("0000");
    expect(hex.toBinary("F")).toBe("1111");
    expect(hex.toBinary("ff")).toBe("11111111");
    expect(hex.toBinary("AA")).toBe("10101010");
    expect(hex.toBinary("dead")).toBe("1101111010101101");
  });

  it("should handle case-insensitive input", () => {
    expect(hex.toBinary("FF")).toBe("11111111");
    expect(hex.toBinary("ff")).toBe("11111111");
    expect(hex.toBinary("Ff")).toBe("11111111");
  });
});

describe("hex.FromUint8", () => {
  it("should contain correct hex strings for byte values", () => {
    expect(hex.FromUint8[0]).toBe("00");
    expect(hex.FromUint8[15]).toBe("0f");
    expect(hex.FromUint8[16]).toBe("10");
    expect(hex.FromUint8[255]).toBe("ff");
    expect(hex.FromUint8[171]).toBe("ab");
  });
});

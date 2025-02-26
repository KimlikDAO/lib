import { expect, it, test } from "bun:test";
import hex from "../hex";

test("hexToBinary on select values", () => {
  expect(hex.toBinary("AA")).toBe("10101010");
  expect(hex.toBinary("F")).toBe("1111");
});

test("to/from uint8Array", () => {
  /** @const {!Uint8Array} */
  const arr = hex.toUint8Array("ABCDEF");
  expect(hex.from(arr).toUpperCase()).toBe("ABCDEF");
});

test("to/from uint8Array with odd digits", () => {
  /** @const {!Uint8Array} */
  const arr = hex.toUint8Array("9ABCDEF");
  expect(hex.from(arr).toUpperCase()).toBe("09ABCDEF");
});

it("should convert binary to hex", () => {
  expect(hex.from(Uint8Array.from([1, 2, 3]))).toBe("010203");
});

it("should convert hex to binary", () => {
  expect(hex.toUint8Array("010203")).toEqual(Uint8Array.from([1, 2, 3]));
});

it("should handle missing leading zero", () => {
  expect(hex.toUint8Array("10203")).toEqual(Uint8Array.from([1, 2, 3]));
});


test("hex conversion tests", () => {
  expect(hex.from(Uint8Array.from([]))).toBe("");
  expect(hex.from(Uint8Array.from([1, 2, 3]))).toBe("010203");
  expect(hex.from(Uint8Array.from([255, 255, 255]))).toBe("ffffff");
});

test("hexten conversion tests", () => {
  expect(hex.toUint8Array("")).toEqual(Uint8Array.from([]));
  expect(hex.toUint8Array("a")).toEqual(Uint8Array.from([10]));
  expect(hex.toUint8Array("ab")).toEqual(Uint8Array.from([171]));
  expect(hex.toUint8Array("abc")).toEqual(Uint8Array.from([10, 188]));
});

test("Uint32Array extended hex tests", () => {
  const buff = Uint32Array.from([2, 2, 2, 2]);
  hex.intoUint32Array(buff, "00000001");
  expect(buff).toEqual(Uint32Array.from([1, 2, 2, 2]));
  hex.intoUint32Array(buff, "10000000");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 2, 2, 2]));
  hex.intoUint32Array(buff, "100000001");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 1, 2, 2]));
  hex.intoUint32Array(buff, "1000000000000001");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 1, 2, 2]));
  hex.intoUint32Array(buff, "10000000000000001");
  expect(buff).toEqual(Uint32Array.from([Number("0x10000000"), 0, 1, 2]));
});

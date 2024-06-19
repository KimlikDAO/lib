import { expect, it, test } from "bun:test";
import { hex, hexten, uint32ArrayeHexten, uint8ArrayeHexten } from "../çevir";

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

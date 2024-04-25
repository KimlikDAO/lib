import { assertArrayEq, assertEq } from "../../testing/assert";
import { hex, hexten, uint32ArrayeHexten, uint8ArrayeHexten } from "../çevir";

const testHex = () => {
  assertEq(hex(Uint8Array.from([])), "");
  assertEq(hex(Uint8Array.from([1, 2, 3])), "010203");
  assertEq(hex(Uint8Array.from([255, 255, 255])), "ffffff");
}

const testHexten = () => {
  assertArrayEq(hexten(""), Uint8Array.from([]));
  assertArrayEq(hexten("a"), Uint8Array.from([10]));
  assertArrayEq(hexten("ab"), Uint8Array.from([171]));
  assertArrayEq(hexten("abc"), Uint8Array.from([10, 188]));
}

const testUint8ArrayeHexten = () => {
  const buff = Uint8Array.from([10, 10, 10, 10, 10, 10]);
  uint8ArrayeHexten(buff, "");
  assertArrayEq(buff, [10, 10, 10, 10, 10, 10]);
  uint8ArrayeHexten(buff, "A0B0C");
  assertArrayEq(buff, [10, 11, 12, 10, 10, 10]);
  uint8ArrayeHexten(buff.subarray(3), "FFFF");
  assertArrayEq(buff, [10, 11, 12, 255, 255, 10]);
}

const testUint32ArrayeHexten = () => {
  const buff = Uint32Array.from([2, 2, 2, 2]);
  uint32ArrayeHexten(buff, "00000001");
  assertArrayEq(buff, [1, 2, 2, 2]);
  uint32ArrayeHexten(buff, "10000000");
  assertArrayEq(buff, [Number("0x10000000"), 2, 2, 2]);
  uint32ArrayeHexten(buff, "100000001");
  assertArrayEq(buff, [Number("0x10000000"), 1, 2, 2]);
  uint32ArrayeHexten(buff, "1000000000000001");
  assertArrayEq(buff, [Number("0x10000000"), 1, 2, 2]);
  uint32ArrayeHexten(buff, "10000000000000001");
  assertArrayEq(buff, [Number("0x10000000"), 0, 1, 2]);
}

testHex();
testHexten();
testUint8ArrayeHexten();
testUint32ArrayeHexten();

import { expect, test } from "bun:test";
import hex from "../../../util/hex";
import { Op, OpData } from "../opcodes";
import { byteLength, concat, evm, pushBytes, pushNumber, toOpData } from "../types";

test("calculates correct byte length for empty bytes", () => {
  expect(byteLength([1])).toBe(1);
  expect(byteLength([new evm.bytes(0)])).toBe(0);
  expect(byteLength([new evm.bytes(0), 1, 2, 3])).toBe(3);
  expect(byteLength([1, 2, 3, 4, 5, new evm.bytes(10)])).toBe(15);
  expect(byteLength([1, 2, 3, 4, 5, new evm.bytes(10), 1, 2, 3, 4, 5])).toBe(20);
  expect(byteLength([new evm.bytes(10), new evm.bytes(10)])).toBe(20);
});

test("converts array to OpData correctly", () => {
  expect(toOpData([1, 2, 3, evm.bytes.from("123")]))
    .toEqual(evm.bytes.from("123123"));
  expect(toOpData([1, evm.bytes.from("123"), 4]))
    .toEqual(evm.bytes.from("11234"));
});

test("pushes number correctly", () => {
  expect(pushNumber(0)).toEqual(OpData.from([Op.PUSH0]));
  expect(pushNumber(1)).toEqual(OpData.from([Op.PUSH1, 1]));
  expect(pushNumber(255)).toEqual(OpData.from([Op.PUSH1, 255]));
  expect(pushNumber(256)).toEqual(OpData.from([Op.PUSH2, 1, 0]));
});

test("pushes empty bytes correctly", () => {
  expect(pushBytes(evm.bytes.from(""))).toEqual(OpData.from([Op.PUSH0]));
  expect(pushBytes(evm.bytes.from("0"))).toEqual(OpData.from([Op.PUSH0]));
  expect(pushBytes(evm.bytes.from("1"))).toEqual(OpData.from([Op.PUSH1, 1]));
  expect(pushBytes(hex.toUint8Array("AABBCC"))).toEqual(OpData.from([Op.PUSH3, 0xaa, 0xbb, 0xcc]));
});

test("concatenates OpData correctly", () => {
  expect(concat(OpData.from("0123"), OpData.from("4567")))
    .toEqual(OpData.from("01234567"));
  expect(concat(OpData.from([]), OpData.from("4567")))
    .toEqual(OpData.from("4567"));
});

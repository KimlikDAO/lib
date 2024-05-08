import { assertArrayEq, assertEq } from "../../../testing/assert";
import { hexten } from "../../../util/çevir";
import { Op, OpData } from "../opcodes";
import { byteLength, evm, pushBytes, pushNumber, toOpData, concat } from "../types";

const testByteLength = () => {
  assertEq(byteLength([1]), 1);
  assertEq(byteLength([new evm.bytes(0)]), 0);
  assertEq(byteLength([new evm.bytes(0), 1, 2, 3]), 3);
  assertEq(byteLength([1, 2, 3, 4, 5, new evm.bytes(10)]), 15);
  assertEq(byteLength([1, 2, 3, 4, 5, new evm.bytes(10), 1, 2, 3, 4, 5]), 20);
  assertEq(byteLength([new evm.bytes(10), new evm.bytes(10)]), 20);
}

const testToOpData = () => {
  assertArrayEq(toOpData([1, 2, 3, evm.bytes.from("123")]), evm.bytes.from("123123"));
  assertArrayEq(toOpData([1, evm.bytes.from("123"), 4]), evm.bytes.from("11234"));
}

const testPushNumber = () => {
  assertArrayEq(pushNumber(0), OpData.from([Op.PUSH0]));
  assertArrayEq(pushNumber(1), OpData.from([Op.PUSH1, 1]));
  assertArrayEq(pushNumber(255), OpData.from([Op.PUSH1, 255]));
  assertArrayEq(pushNumber(256), OpData.from([Op.PUSH2, 1, 0]));
}

const testPushBytes = () => {
  assertArrayEq(pushBytes(evm.bytes.from("")), OpData.from([Op.PUSH0]));
  assertArrayEq(pushBytes(evm.bytes.from("0")), OpData.from([Op.PUSH0]));
  assertArrayEq(pushBytes(evm.bytes.from("1")), OpData.from([Op.PUSH1, 1]));
  assertArrayEq(pushBytes(hexten("AABBCC")), OpData.from([Op.PUSH3, 0xaa, 0xbb, 0xcc]));
}

const testConcat = () => {
  assertArrayEq(concat(OpData.from("0123"), OpData.from("4567")), OpData.from("01234567"));
  assertArrayEq(concat(OpData.from([]), OpData.from("4567")), OpData.from("4567"));
}

testByteLength();
testToOpData();
testPushNumber();
testPushBytes();
testConcat();

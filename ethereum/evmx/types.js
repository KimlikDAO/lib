import { assertEq } from "../../testing/assert";
import hex from "../../util/hex";
import { Op, OpData, Ops, pushN } from "./opcodes";

/** @const */
const evm = {};

/** @typedef {string} */
evm.address = {};

/** @typedef {!Uint8Array} */
evm.bytes = Uint8Array;

/**
 * @param {Ops} ops
 */
const byteLength = (ops) => {
  let length = ops.length;
  for (const op of ops)
    if (op instanceof Uint8Array) length += op.length - 1;
  return length;
}

/**
 * Given an Ops (an array of Op's or OpData), flattens it into a single
 * evm.bytes (Uint8Array).
 *
 * @param {Ops} ops
 * @return {OpData}
 */
const toOpData = (ops) => {
  /** @const {evm.bytes} */
  const out = new evm.bytes(byteLength(ops));
  let /** number */ i = 0, /** number */ j = 0;

  for (let k = 0; k < ops.length; ++k) {
    const op = ops[k];
    if (op instanceof Uint8Array) {
      out.set(new evm.bytes(/** @type {!Array<Op>} */(ops.slice(i, k))), j);
      out.set(op, j + k - i);
      j += k - i + op.length
      i = k + 1;
    }
  }

  if (i < ops.length) out.set(new evm.bytes(/** @type {!Array<Op>} */(ops.slice(i))), j);
  return out;
}

/**
 * @param {evm.address} addr
 * @return {OpData}
 */
const address = (addr) => {
  if (addr.startsWith("0x")) addr = addr.slice(2);
  assertEq(addr.length, 40);
  return hex.toUint8Array(addr);
}

/**
 * @param {evm.address} addr
 * @return {OpData}
 */
const pushAddress = (addr) => {
  /** @const {OpData} */
  const out = new OpData(21);
  out[0] = Op.PUSH20;
  out.set(address(addr), 1);
  return out;
}

/**
 * @param {bigint|number} n
 * @return {OpData}
 */
const pushNumber = (n) => {
  if (n == 0) return new OpData([Op.PUSH0]);
  /** @type {string} */
  let ser = n.toString(16);
  if (ser.length & 1) ser = "0" + ser;
  /** @const {OpData} */
  const out = new OpData(ser.length / 2 + 1);
  out[0] = pushN(ser.length / 2);
  for (let i = 0, j = 1; i < ser.length; ++j, i += 2)
    out[j] = parseInt(ser.slice(i, i + 2), 16);
  return out;
}

/**
 * @param {evm.bytes} bytes
 * @return {OpData}
 */
const pushBytes = (bytes) => {
  if (bytes.length == 0 || bytes.length == 1 && bytes[0] == 0)
    return new OpData([Op.PUSH0]);
  /** @const {OpData} */
  const out = new OpData(bytes.length + 1);
  out[0] = pushN(bytes.length);
  out.set(bytes, 1);
  return out;
}

/**
 * @param {...OpData} opdatas
 * @return {OpData}
 */
const concat = (...opdatas) => {
  /** @const {OpData} */
  const out = new OpData(opdatas.reduce((x, y) => x + y.length, 0));
  let offset = 0;
  for (const opdata of opdatas) {
    out.set(opdata, offset);
    offset += opdata.length;
  }
  return out;
}

export {
  address,
  byteLength,
  concat,
  evm,
  pushAddress,
  pushBytes,
  pushNumber,
  toOpData
};

import { hexten } from "../../util/çevir";

/** @const */
const evm = {};

/** @typedef {string} */
evm.address = {};

/** @typedef {!Uint8Array} */
evm.bytes = {};

/**
 * @param {!Array<!Op|!OpCode>} ops
 * @return {evm.bytes}
 */
const opsToBytes = (ops) => hexten(ops.join(""));

/**
 * @param {evm.bytes} b1
 * @param {evm.bytes} b2
 * @return {evm.bytes}
 */
const concat = (b1, b2) => {
  const ret = new Uint8Array(b1.length + b2.length);
  ret.set(b1);
  ret.set(b2, b1.length);
  return ret;
}

/**
 * @param {Address} addr
 * @return {OpData}
 */
const address = (addr) => {
  if (addr.startsWith("0x")) addr = addr.slice(2);
  return addr.toUpperCase();
}

export {
  evm,
  address,
  concat,
  opsToBytes
};

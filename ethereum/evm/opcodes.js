/** @enum {string} */
const Op = {
  STOP: "00",
  ADD: "01",
  SHA3: "20",
  CALLDATASIZE: "36",
  CALLDATACOPY: "37",
  CODECOPY: "39", // destOffset, offset, length, memory[destOffset:destOffset+length] = code[offset:offset+length]
  RETURNDATASIZE: "3D",
  RETURNDATACOPY: "3E",
  DIFFICULTY: "44",
  GASLIMIT: "45",
  CHAINID: "46",
  POP: "50",
  MSTORE: "52",
  SLOAD: "54",
  SSTORE: "55",
  JUMP: "56",
  JUMPI: "57",
  GAS: "5A",
  JUMPDEST: "5B",
  PUSH0: "5F",
  PUSH1: "60",
  PUSH20: "73",
  DUP1: "80",
  DUP2: "81",
  DUP3: "82",
  DUP4: "83",
  DUP5: "84",
  DUP6: "85",
  DUP7: "86",
  DUP16: "8F",
  CREATE: "FO", // CREATE(value, offset, length)
  CALL: "F1", // CALL(gas, addr, value, argsOffset, argsLength, retOffset, retLength)
  RETURN: "F3", // RETURN(offset, length) return memory[offset : offset + length]
  DELEGATECALL: "F4", // DELEGATECALL(gas, addr, argsOffset, argsLength, retOffset, retLength)
  REVERT: "FD"
}

/**
 * @typedef {string}
 */
const OpData = {};

/**
 * @param {number}
 * @return {Op}
 */
const dupN = (n) => /** @type {Op} */((127 + n).toString(16));

/**
 * @param {number} n number of bytes to push to the stack as a word
 * @return {Op}
 */
const pushN = (n) => /** @type {Op} */((95 + n).toString(16));

/**
 * @param {!bigint} n
 * @return {!Array<Op|OpData>}
 */
const pushNumber = (n) => {
  if (n == 0) return [Op.PUSH0];
  /** @type {string} */
  let ser = n.toString(16);
  if (ser.length & 1) ser = "0" + ser;
  return [pushN(ser.length / 2), ser];
}

export {
  Op,
  OpData,
  dupN,
  pushN,
  pushNumber,
};

/** @enum {number} */
const Op = {
  STOP: 0x00,
  ADD: 0x01,
  MUL: 0x02,
  SUB: 0x03,
  DIV: 0x04,
  SDIV: 0x05,
  MOD: 0x06,
  SMOD: 0x07,
  ADDMOD: 0x08,
  MULMOD: 0x09,
  SIGNEXTEND: 0x0B,
  LT: 0x10,
  GT: 0x11,
  SLT: 0x12,
  SGT: 0x13,
  EQ: 0x14,
  ISZERO: 0x15,
  AND: 0x16,
  OR: 0x17,
  XOR: 0x18,
  NOT: 0x19,
  BYTE: 0x1A,
  SHL: 0x1B,
  SHR: 0x1C,
  SAR: 0x1D,
  SHA3: 0x20,
  ADDRESS: 0x30,
  BALANCE: 0x31,
  ORIGIN: 0x32,
  CALLER: 0x33,
  CALLVALUE: 0x34,
  CALLDATALOAD: 0x35,
  CALLDATASIZE: 0x36,
  CALLDATACOPY: 0x37,
  CODESIZE: 0x38,
  CODECOPY: 0x39, // destOffset, offset, length, memory[destOffset:destOffset+length] = code[offset:offset+length]
  GASPRICE: 0x3A,
  EXTCODESIZE: 0x3B,
  EXTCODECOPY: 0x3C,
  RETURNDATASIZE: 0x3D,
  RETURNDATACOPY: 0x3E,
  EXTCODEHASH: 0x3F,
  BLOCKHASH: 0x40,
  COINBASE: 0x41,
  TIMESTAMP: 0x42,
  NUMBER: 0x43,
  DIFFICULTY: 0x44,
  GASLIMIT: 0x45,
  CHAINID: 0x46,
  SELFBALANCE: 0x47,
  BASEFEE: 0x48,
  BLOBHASH: 0x49,
  BLOBBASEFEE: 0x4A,
  POP: 0x50,
  MLOAD: 0x51,
  MSTORE: 0x52,
  MSTORE8: 0x53,
  SLOAD: 0x54,
  SSTORE: 0x55,
  JUMP: 0x56,
  JUMPI: 0x57,
  PC: 0x58,
  MSIZE: 0x59,
  GAS: 0x5A,
  JUMPDEST: 0x5B,
  TLOAD: 0x5C,
  TSTORE: 0x5D,
  MCOPY: 0x5E,
  PUSH0: 0x5F,
  PUSH1: 0x60,
  PUSH2: 0x61,
  PUSH3: 0x62,
  PUSH20: 0x73,
  PUSH32: 0x7F,
  DUP1: 0x80,
  DUP2: 0x81,
  DUP3: 0x82,
  DUP4: 0x83,
  DUP5: 0x84,
  DUP6: 0x85,
  DUP7: 0x86,
  DUP16: 0x8F,
  SWAP1: 0x90,
  SWAP16: 0x9F,
  LOG0: 0xA0,
  LOG1: 0xA1,
  LOG2: 0xA2,
  LOG3: 0xA3,
  LOG4: 0xA4,
  CREATE: 0xF0, // CREATE(value, offset, length)
  CALL: 0xF1, // CALL(gas, addr, value, argsOffset, argsLength, retOffset, retLength)
  RETURN: 0xF3, // RETURN(offset, length) return memory[offset : offset + length]
  DELEGATECALL: 0xF4, // DELEGATECALL(gas, addr, argsOffset, argsLength, retOffset, retLength)
  CREATE2: 0xF5,
  REVERT: 0xFD
}

/**
 * @typedef {!Uint8Array}
 */
const OpData = Uint8Array;

/**
 * @typedef {!Array<Op|OpData>}
 */
const Ops = {};

/**
 * @param {number} n
 * @return {Op}
 */
const dupN = (n) => /** @type {Op} */(127 + n);

/**
 * @param {number} n number of bytes to push to the stack as a word
 * @return {Op}
 */
const pushN = (n) => /** @type {Op} */(95 + n);

export {
  Op,
  Ops,
  OpData,
  dupN,
  pushN,
};

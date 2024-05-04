import { Op, pushNumber } from "./opcodes";
import { address, concat, evm, opsToBytes } from "./types.js";

/**
 * @param {number} offset
 */
const delegateCall = (offset) => opsToBytes([
  Op.CALLDATASIZE,
  Op.PUSH0,
  Op.PUSH0,
  Op.CALLDATACOPY,
  Op.PUSH0,
  Op.PUSH0,
  Op.CALLDATASIZE,
  Op.PUSH0,
  Op.PUSH0,
  Op.SLOAD,
  Op.GAS,
  Op.DELEGATECALL,
  Op.RETURNDATASIZE,
  Op.PUSH0,
  Op.PUSH0,
  Op.RETURNDATACOPY,
  Op.RETURNDATASIZE,
  Op.PUSH0,
  Op.DUP3,
  ...pushNumber(offset + 23),
  Op.JUMPI,
  Op.REVERT,
  Op.JUMPDEST,
  Op.RETURN
]);

/**
 * @param {evm.address} codeAddress
 * @return {evm.bytes}
 */
const upgradableProxy = (codeAddress) => {
  /** @const {evm.bytes} */
  const dc = delegateCall(0);

  return concat(opsToBytes([
    Op.PUSH20, address(codeAddress), Op.PUSH0, Op.SSTORE, // storage[0] = codeAddress
    ...pushNumber(dc.length),
    Op.DUP1, // len len
    ...pushNumber(32), // 32 len len
    Op.PUSH0, // 0 32 len len
    Op.CODECOPY, // len
    Op.PUSH0, // 0 len
    Op.RETURN
  ]), dc);
}

export {
  delegateCall,
  upgradableProxy
};

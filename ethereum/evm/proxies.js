import { Op, OpData } from "./opcodes";
import { evm, pushAddress, pushBytes, pushNumber, toOpData } from "./types.js";

/**
 * @param {number} offset
 * @param {evm.bytes} slot
 * @return {OpData}
 */
const delegateCall = (offset, slot) => {
  /** @const {OpData}  */
  const pushSlot = pushBytes(slot);
  return toOpData([
    Op.CALLDATASIZE,
    Op.PUSH0,
    Op.PUSH0,
    Op.CALLDATACOPY,
    Op.PUSH0,
    Op.PUSH0,
    Op.CALLDATASIZE,
    Op.PUSH0,
    pushSlot,
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
    pushNumber(offset + pushSlot.length + 22),
    Op.JUMPI,
    Op.REVERT,
    Op.JUMPDEST,
    Op.RETURN
  ])
};

/**
 * @param {evm.address} implAddress
 * @param {evm.bytes} implSlot
 * @return {OpData}
 */
const upgradableProxy = (implAddress, implSlot) => {
  /** @const {OpData} */
  const call = delegateCall(0, implSlot);
  /** @const {OpData} */
  const pushImplSlot = pushBytes(implSlot);

  return toOpData([
    pushAddress(implAddress), pushImplSlot, Op.SSTORE, // storage[0] = codeAddress
    pushNumber(call.length),
    Op.DUP1, // len len
    pushNumber(21 + pushImplSlot.length + 10), // 32 len len
    Op.PUSH0, // 0 32 len len
    Op.CODECOPY, // len
    Op.PUSH0, // 0 len
    Op.RETURN,
    call
  ]);
}

export {
  delegateCall,
  upgradableProxy
};

import { Op, pushNumber } from "./opcodes";
import { evm, toOpData } from "./types";

/** @type {{ addr: evm.address, kpass: boolean }} */
const AddressWithKPass = {};

/** @const {bigint} */
const SZABO = 10n ** 12n;

/**
 * @param {!Array<evm.address>} recipients
 * @param {number} amountSzabos
 * @return {evm.bytes}
 */
const batchSendFixedAmount = (recipients, amountSzabos) => {
  /** @const {!Array<Op|OpData>} */
  const ops = pushNumber(BigInt(amountSzabos) * SZABO);
  // val | 0 0 0 0 
  for (const recipient of recipients)
    ops.push(Op.PUSH0, Op.PUSH0, Op.PUSH0, Op.PUSH0, Op.DUP5,
      Op.PUSH20, address(recipient), Op.PUSH0, Op.CALL, Op.POP);
  return toOpData(ops.slice(0, -1));
}

/**
 * Generates a batchSend bytecode for an EVM chain that doesn't support
 * the PUSH0 opcode.
 *
 * @param {!Array<evm.address>} recipients
 * @param {number} amountSzabos
 * @return {evm.bytes}
 */
const batchSendFixedAmountNoPush0 = (recipients, amountSzabos) => {
  /** @const {!Array<Op|OpData>} */
  const ops = [
    ...pushNumber(BigInt(amountSzabos) * SZABO),
    ...pushNumber(0n)
  ];
  // val 0 | 0 0 0 0 val addr
  for (const recipient of recipients)
    ops.push(Op.DUP1, Op.DUP1, Op.DUP1, Op.DUP1, Op.DUP6,
      Op.PUSH20, address(recipient), Op.DUP3, Op.CALL, Op.POP);
  return opsToBytes(ops.slice(0, -1));
}

/**
 * Generates a batchSend bytecode for an EVM chain that doesn't support
 * the PUSH0 opcode.
 *
 * @param {!Array<AddressAndKPass>} recipients
 * @param {number} withKPassSzabos
 * @param {number} withoutKPassSzabos
 * @return {{ code: evm.bytes, valueSzabos: number}}
 */
const batchSendWithKPassNoPush0 = (recipients, withKPassSzabos, withoutKPasstSzabos) => {
  /** @const {!Array<Op|OpData>} */
  const ops = [
    ...pushNumber(BigInt(withKPassSzabos) * SZABO),
    ...pushNumber(BigInt(withoutKPasstSzabos) * SZABO),
    ...pushNumber(0n)
  ];
  /** @type {number} */
  let valueSzabos = 0;
  // highVal lowVal 0 | 0 0 0 0 val addr
  for (const { addr, kpass } of recipients) {
    ops.push(Op.DUP1, Op.DUP1, Op.DUP1, Op.DUP1, kpass ? Op.DUP7 : Op.DUP6,
      Op.PUSH20, address(addr), Op.DUP3, Op.CALL, Op.POP);
    valueSzabos += kpass ? withKPassSzabos : withoutKPasstSzabos;
  }
  return {
    code: opsToBytes(ops.slice(0, -1)),
    valueSzabos
  };
}

export {
  AddressWithKPass,
  SZABO,
  batchSendFixedAmount,
  batchSendFixedAmountNoPush0,
  batchSendWithKPassNoPush0,
};


import {
  AddrArg,
  BoolArg,
  DataArg,
  Expression,
  LocnArg,
  SizeArg,
  UintArg,
  WeisArg,
} from "./expression";
import { Fragment } from "./fragment";
import { Op } from "./opcodes";
import { Ops } from "./ops";
import { label } from "./statement";
import {
  Bool,
  Locn,
  Size,
} from "./types";

const address = (): Expression => new Expression([], Ops[Op.ADDRESS]!);

const balance = (addr: AddrArg): Expression =>
  new Expression([addr], Ops[Op.BALANCE]!);

const caller = (): Expression => new Expression([], Ops[Op.CALLER]!);

const gas = (): Expression => new Expression([], Ops[Op.GAS]!);

const calldataSize = (): Expression => new Expression([], Ops[Op.CALLDATASIZE]!);

const returndataSize = (): Expression =>
  new Expression([], Ops[Op.RETURNDATASIZE]!);

const sload = (key: DataArg): Expression =>
  new Expression([key], Ops[Op.SLOAD]!);

const sstore = (key: DataArg, value: DataArg): Expression =>
  new Expression([value, key], Ops[Op.SSTORE]!);

const copy = (
  op: Op,
  dest: LocnArg,
  source: LocnArg,
  size: SizeArg,
): Expression => new Expression([size, source, dest], Ops[op]!);

const calldataCopy = (
  dest: LocnArg,
  source: LocnArg = 0,
  size: SizeArg = calldataSize(),
): Expression => copy(Op.CALLDATACOPY, dest, source, size);

const returndataCopy = (
  dest: LocnArg,
  source: LocnArg = 0,
  size: SizeArg = returndataSize(),
): Expression => copy(Op.RETURNDATACOPY, dest, source, size);

const codeCopy = (
  dest: LocnArg,
  source: LocnArg,
  size: SizeArg,
): Expression => copy(Op.CODECOPY, dest, source, size);

const delegateCall = (
  gasAmount: UintArg,
  addr: AddrArg,
  argsOffset: LocnArg,
  argsSize: SizeArg,
  retOffset: LocnArg,
  retSize: SizeArg,
): Expression => new Expression([
  retSize,
  retOffset,
  argsSize,
  argsOffset,
  addr,
  gasAmount,
], Ops[Op.DELEGATECALL]!);

const call = (
  gasAmount: UintArg,
  addr: AddrArg,
  value: WeisArg,
  argsOffset: LocnArg,
  argsSize: SizeArg,
  retOffset: LocnArg,
  retSize: SizeArg,
): Expression => new Expression([
  retSize,
  retOffset,
  argsSize,
  argsOffset,
  value,
  addr,
  gasAmount,
], Ops[Op.CALL]!);

const ret = (offset: LocnArg, size: SizeArg): Expression =>
  new Expression([size, offset], Ops[Op.RETURN]!);

const returnOrRevert = (
  cond: BoolArg,
  offset: LocnArg,
  size: SizeArg,
): Expression => {
  const ok = label("returnOrRevert-ok");
  return new Expression([size, offset, cond], Fragment.from({
    expect: [Size, Locn, Bool],
    pop: 3,
    code: [
      ...ok.ref(true).frag.code,
      Op.JUMPI,
      Op.REVERT,
      ...ok.dest().frag.code,
      Op.RETURN,
    ],
    halt: "⊢",
  }));
}

export {
  address,
  balance,
  call,
  calldataCopy,
  calldataSize,
  caller,
  codeCopy,
  delegateCall,
  gas,
  ret, returndataCopy,
  returndataSize, returnOrRevert, sload,
  sstore
};

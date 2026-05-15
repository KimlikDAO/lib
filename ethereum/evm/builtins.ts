import {
  AddrArg,
  BoolArg,
  DataArg,
  ExprArg,
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
import { Bool, Data, EvmType, Locn, Size, Uint, Word } from "./types";

const binary = (
  opcode: Op,
  lhs: UintArg,
  rhs: UintArg,
  out: EvmType = Uint,
): Expression => new Expression([lhs, rhs], Fragment.from({
  expect: [Uint, Uint],
  pop: 2,
  ensure: [out],
  code: [opcode],
}));

const bitAnd = (lhs: UintArg, rhs: UintArg): Expression =>
  binary(Op.AND, lhs, rhs);

const mul = (lhs: UintArg, rhs: UintArg): Expression =>
  binary(Op.MUL, lhs, rhs);

const sub = (lhs: UintArg, rhs: UintArg): Expression =>
  new Expression([rhs, lhs], Fragment.from({
    expect: [Uint, Uint],
    pop: 2,
    ensure: [Uint],
    code: [Op.SUB],
  }));

const shr = (shift: UintArg, value: UintArg): Expression =>
  new Expression([value, shift], Fragment.from({
    expect: [Uint, Uint],
    pop: 2,
    ensure: [Uint],
    code: [Op.SHR],
  }));

const eq = (lhs: ExprArg, rhs: ExprArg): Expression =>
  new Expression([lhs, rhs], Ops[Op.EQ]!);

function range(stop: number): number[];
function range(start: number, stop: number, step?: number): number[];
function range(startOrStop: number, stop?: number, step = 1): number[] {
  if (step == 0)
    throw new RangeError("range step cannot be 0");
  const start = stop === undefined ? 0 : startOrStop;
  const end = stop === undefined ? startOrStop : stop;
  const out: number[] = [];
  if (0 < step)
    for (let i = start; i < end; i += step)
      out.push(i);
  else
    for (let i = start; end < i; i += step)
      out.push(i);
  return out;
}

const address = (): Expression => new Expression([], Ops[Op.ADDRESS]!);

const balance = (addr: AddrArg): Expression =>
  new Expression([addr], Ops[Op.BALANCE]!);

const caller = (): Expression => new Expression([], Ops[Op.CALLER]!);

const gas = (): Expression => new Expression([], Ops[Op.GAS]!);

const calldataSize = (): Expression => new Expression([], Ops[Op.CALLDATASIZE]!);

const returndataSize = (): Expression =>
  new Expression([], Ops[Op.RETURNDATASIZE]!);

const calldataLoad = (offset: LocnArg, type: EvmType = Data): Expression =>
  new Expression([offset], Fragment.from({
    expect: [Locn],
    pop: 1,
    ensure: [type],
    code: [Op.CALLDATALOAD],
  }));

const mstore = (offset: UintArg, value: ExprArg): Expression =>
  new Expression([value, offset], Fragment.from({
    expect: [Word, Uint],
    pop: 2,
    code: [Op.MSTORE],
  }));

const keccak256 = (offset: UintArg, size: SizeArg): Expression =>
  new Expression([size, offset], Fragment.from({
    expect: [Size, Uint],
    pop: 2,
    ensure: [Data],
    code: [Op.SHA3],
  }));

const sload = (key: DataArg, type: EvmType = Data): Expression =>
  new Expression([key], Fragment.from({
    expect: [Data],
    pop: 1,
    ensure: [type],
    code: [Op.SLOAD],
  }));

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
  bitAnd,
  call,
  calldataCopy,
  calldataLoad,
  calldataSize,
  caller,
  codeCopy,
  delegateCall,
  eq,
  gas,
  keccak256,
  mstore,
  mul,
  range,
  ret,
  returndataCopy,
  returndataSize,
  returnOrRevert,
  shr,
  sload,
  sub,
  sstore
};

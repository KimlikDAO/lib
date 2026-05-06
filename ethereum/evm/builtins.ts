import { bind } from "./binder";
import { compose } from "./composer";
import { Op } from "./opcodes";
import { Ops } from "./ops";
import {
  AddrArg,
  Bool,
  BoolArg,
  DataArg,
  EvmType,
  Fragment,
  Lit,
  Locn,
  LocnArg,
  Size,
  SizeArg,
  UintArg,
  WeisArg,
  blob,
  label,
} from "./types";

type Combinator = (...args: unknown[]) => Fragment;
type ReverseCombinator = Combinator;

const address = (): Fragment => Ops[Op.ADDRESS]!;

const balance = (): Fragment => Ops[Op.BALANCE]!;

const gas = (): Fragment => Ops[Op.GAS]!;

const pop = (): Fragment => Ops[Op.POP]!;

const push = (lit: Lit, type: EvmType): Fragment => Fragment.fromLit(lit, type);

const calldataSize = (): Fragment => Ops[Op.CALLDATASIZE]!;

const returndataSize = (): Fragment => Ops[Op.RETURNDATASIZE]!;

const sload = (key: DataArg): Fragment => bind([key], Ops[Op.SLOAD]!);

/** @satisfies {ReverseCombinator} */
const sstore = (key: DataArg, value: DataArg): Fragment =>
  bind([value, key], Ops[Op.SSTORE]!);

const copy = (
  op: Op,
  dest: LocnArg,
  source: LocnArg,
  size: SizeArg,
): Fragment => bind([size, source, dest], Ops[op]!);

/** @satisfies {ReverseCombinator} */
const calldataCopy = (
  dest: LocnArg,
  source: LocnArg = 0,
  size: SizeArg = calldataSize(),
): Fragment => copy(Op.CALLDATACOPY, dest, source, size);

/** @satisfies {ReverseCombinator} */
const returndataCopy = (
  dest: LocnArg,
  source: LocnArg = 0,
  size: SizeArg = returndataSize(),
): Fragment => copy(Op.RETURNDATACOPY, dest, source, size);

/** @satisfies {ReverseCombinator} */
const codeCopy = (
  dest: LocnArg,
  source: LocnArg,
  size: SizeArg,
): Fragment => copy(Op.CODECOPY, dest, source, size);

/** @satisfies {ReverseCombinator} */
const delegateCall = (
  gasAmount: UintArg,
  addr: AddrArg,
  argsOffset: LocnArg,
  argsSize: SizeArg,
  retOffset: LocnArg,
  retSize: SizeArg,
): Fragment => bind([
  retSize,
  retOffset,
  argsSize,
  argsOffset,
  addr,
  gasAmount,
], Ops[Op.DELEGATECALL]!);

/** @satisfies {ReverseCombinator} */
const call = (
  gasAmount: UintArg,
  addr: AddrArg,
  value: WeisArg,
  argsOffset: LocnArg,
  argsSize: SizeArg,
  retOffset: LocnArg,
  retSize: SizeArg,
): Fragment => bind([
  retSize,
  retOffset,
  argsSize,
  argsOffset,
  value,
  addr,
  gasAmount,
], Ops[Op.CALL]!);

/** @satisfies {ReverseCombinator} */
const ret = (offset: LocnArg, size: SizeArg): Fragment =>
  bind([size, offset], Ops[Op.RETURN]!);

/** @satisfies {ReverseCombinator} */
const returnOrRevert = (
  cond: BoolArg,
  offset: LocnArg,
  size: SizeArg,
): Fragment => {
  const ok = label("returnOrRevert-ok");
  return bind([size, offset, cond], new Fragment(
    [Size, Locn, Bool],
    3,
    [],
    [...ok.ref(true).code, Op.JUMPI, Op.REVERT, ...ok.dest().code, Op.RETURN],
    "⊢"
  ));
}

const ifThen = (cond: BoolArg, then: Fragment): Fragment => {
  void cond;
  void then;
  throw new TypeError("ifThen is not implemented yet");
}

const ifElse = (cond: BoolArg, t: Fragment, f: Fragment): Fragment => {
  void cond;
  void t;
  void f;
  throw new TypeError("ifElse is not implemented yet");
}

const unrollFor = <T>(
  init: Fragment | Fragment[],
  arr: T[],
  fn: (elm: T) => Fragment | Fragment[]
): Fragment => {
  const frags = arr.flatMap(fn);
  const initArr = Array.isArray(init) ? init : [init];
  return compose(...initArr, ...frags);
}

export {
  Combinator,
  Ops,
  ReverseCombinator,
  address,
  balance,
  blob,
  call,
  calldataCopy,
  calldataSize,
  codeCopy,
  delegateCall,
  gas,
  ifElse,
  ifThen,
  pop,
  push,
  ret,
  returnOrRevert,
  returndataCopy,
  returndataSize,
  sload,
  sstore,
  unrollFor
};

import { combine, compose, infer } from "./composer";
import { Op } from "./opcodes";
import { Ops } from "./ops";
import {
  Addr, AddrArg,
  Bool,
  BoolArg,
  EvmType,
  Fragment, Label,
  Lit,
  Locn, LocnArg,
  Size, SizeArg,
  Weis, WeisArg,
  Word, WordArg,
  data,
  label,
} from "./types";

const address = (): Fragment => Ops[Op.ADDRESS]!;

const balance = (): Fragment => Ops[Op.BALANCE]!;

const gas = (): Fragment => Ops[Op.GAS]!;

const pop = (): Fragment => Ops[Op.POP]!;

const push = (lit: Lit, type: EvmType): Fragment => Fragment.fromLit(lit, type);

const calldataSize = (): Fragment => Ops[Op.CALLDATASIZE]!;

const returndataSize = (): Fragment => Ops[Op.RETURNDATASIZE]!;

const jump = (target: Label): Fragment => compose(
  target.ref(true),
  Ops[Op.JUMP]!
);

const jumpi = (target: Label, cond: BoolArg): Fragment => combine(
  infer(cond, Bool),
  target.ref(true),
  Ops[Op.JUMPI]!
);

const sload = (key: WordArg): Fragment => combine(
  infer(key, Word),
  Ops[Op.SLOAD]!
);

const sstore = (key: WordArg, value: WordArg): Fragment => combine(
  infer(value, Word),
  infer(key, Word),
  Ops[Op.SSTORE]!
);

const copy = (
  op: Op,
  dest: LocnArg,
  source: LocnArg,
  size: SizeArg,
): Fragment => combine(
  infer(size, Size),
  infer(source, Locn),
  infer(dest, Locn),
  Ops[op]!,
);

const calldataCopy = (
  dest: LocnArg,
  source: LocnArg = 0,
  size: SizeArg = calldataSize(),
): Fragment => copy(Op.CALLDATACOPY, dest, source, size);

const returndataCopy = (
  dest: LocnArg,
  source: LocnArg = 0,
  size: SizeArg = returndataSize(),
): Fragment => copy(Op.RETURNDATACOPY, dest, source, size);

const codeCopy = (
  dest: LocnArg,
  source: LocnArg,
  size: SizeArg,
): Fragment => copy(Op.CODECOPY, dest, source, size);

const delegateCall = (
  gasAmount: WordArg,
  addr: AddrArg,
  argsOffset: LocnArg,
  argsSize: SizeArg,
  retOffset: LocnArg,
  retSize: SizeArg,
): Fragment => combine(
  infer(retSize, Size),
  infer(retOffset, Locn),
  infer(argsSize, Size),
  infer(argsOffset, Locn),
  infer(addr, Addr),
  infer(gasAmount, Word),
  Ops[Op.DELEGATECALL]!
);

const call = (
  gasAmount: WordArg,
  addr: AddrArg,
  value: WeisArg,
  argsOffset: LocnArg,
  argsSize: SizeArg,
  retOffset: LocnArg,
  retSize: SizeArg,
): Fragment => combine(
  infer(retSize, Size),
  infer(retOffset, Locn),
  infer(argsSize, Size),
  infer(argsOffset, Locn),
  infer(value, Weis),
  infer(addr, Addr),
  infer(gasAmount, Word),
  Ops[Op.CALL]!
);

const ret = (offset: LocnArg, size: SizeArg): Fragment => combine(
  infer(size, Size),
  infer(offset, Locn),
  Ops[Op.RETURN]!
);

const returnOrRevert = (
  cond: BoolArg,
  offset: LocnArg,
  size: SizeArg,
): Fragment => {
  const ok = label("returnOrRevert-ok");
  return combine(
    infer(size, Size),
    infer(offset, Locn),
    jumpi(ok, cond),
    Ops[Op.REVERT]!,
    ok.dest(),
    Ops[Op.RETURN]!
  );
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
  address,
  balance,
  Ops,
  call,
  calldataCopy,
  calldataSize,
  codeCopy,
  data,
  delegateCall,
  gas,
  jump,
  jumpi,
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

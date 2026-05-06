import { bind } from "./binder";
import { Op } from "./opcodes";
import { Ops } from "./ops";
import {
  Addr,
  AddrArg,
  AddrLit,
  Bool,
  BoolArg,
  Fragment,
  label
} from "./types";

const addrEq = (lhs: AddrArg, rhs: AddrArg) =>
  bind([lhs, rhs], new Fragment([Addr, Addr], 2, [Bool], [Op.EQ]));

const assert = (cond: BoolArg): Fragment => {
  const ok = label("check-ok");
  return bind([cond], new Fragment(
    [Bool],
    1,
    [],
    [
      ...ok.ref(true).code,
      Op.JUMPI,
      Op.INVALID,
      ...ok.dest().code,
    ],
    "⊢"
  ));
}

const assertCaller = (addr: AddrLit): Fragment =>
  assert(addrEq(addr, Ops[Op.CALLER]!));

export { assert, assertCaller };

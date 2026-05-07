import { Op } from "./opcodes";
import { Ops } from "./ops";
import { Expression } from "./syntax";
import type { AddrArg, BoolArg } from "./syntax";
import {
  Bool,
  Fragment,
  label
} from "./types";

const addrEq = (lhs: AddrArg, rhs: AddrArg): Expression =>
  new Expression([lhs, rhs], Ops[Op.EQ]!);

const assert = (cond: BoolArg): Expression => {
  const ok = label("check-ok");
  return new Expression([cond], new Fragment(
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

const assertCaller = (addr: AddrArg): Expression =>
  assert(addrEq(addr, Expression.fromFragment(Ops[Op.CALLER]!)));

export { assert, assertCaller };

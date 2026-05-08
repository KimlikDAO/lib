import { caller } from "./builtins";
import { AddrArg, BoolArg, Expression } from "./expression";
import { Fragment } from "./fragment";
import { Op } from "./opcodes";
import { Ops } from "./ops";
import { label } from "./statement";
import { Bool } from "./types";

const addrEq = (lhs: AddrArg, rhs: AddrArg): Expression =>
  new Expression([lhs, rhs], Ops[Op.EQ]!);

const assert = (cond: BoolArg): Expression => {
  const ok = label("assert-ok");
  return new Expression([cond], Fragment.from({
    expect: [Bool],
    pop: 1,
    code: [
      ...ok.ref(true).frag.code,
      Op.JUMPI,
      Op.STOP,
      ...ok.dest().frag.code,
    ],
    halt: "⊢",
  }));
}

const assertCaller = (addr: AddrArg): Expression =>
  assert(addrEq(addr, caller()));

export { assert, assertCaller };

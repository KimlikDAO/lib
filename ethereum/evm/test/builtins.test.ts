import { expect, test } from "bun:test";
import { bind } from "../binder";
import { returnOrRevert, sstore } from "../builtins";
import { Op } from "../opcodes";
import { Expression } from "../syntax";

const compile = (expr: Expression) => bind(expr.args, expr.frag);

test("returnOrRevert emits a packaged conditional termination", () => {
  const out = compile(returnOrRevert(true, 0, 1));

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(out.code.filter((atom): atom is number => typeof atom == "number")).toEqual([
    Op.PUSH1,
    Op.PUSH0,
    Op.PUSH1,
    Op.JUMPI,
    Op.REVERT,
    Op.JUMPDEST,
    Op.RETURN,
  ]);
});

test("sstore returns an expression node", () => {
  const out = sstore(0, 1);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature())).toBe("(Data, Data) → 2|");
  expect(out.args).toHaveLength(2);
  expect(out.args.every((arg) => arg instanceof Expression)).toBe(true);
});

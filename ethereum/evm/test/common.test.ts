import { expect, test } from "bun:test";
import { bind } from "../binder";
import { assert, assertCaller } from "../common";
import { Op } from "../opcodes";
import { Expression, use } from "../syntax";
import { Bool, Fragment, Word } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

const compile = (expr: Expression): Fragment => bind(expr.args, expr.frag);

test("assert binds literal boolean conditions", () => {
  const out = compile(assert(true));

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(numberOps(out.code)).toEqual([
    Op.PUSH1,
    Op.JUMPI,
    Op.INVALID,
    Op.JUMPDEST,
  ]);
});

test("assert currently rejects named stack refs when compiled", () => {
  expect(() => compile(assert(use("cond"))))
    .toThrow("named stack refs are not implemented yet");
});

test("assert accepts boolean expressions", () => {
  const out = compile(assert(Expression.fromFragment(new Fragment([], 0, [Bool], [Op.ISZERO]))));

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(numberOps(out.code)).toEqual([
    Op.ISZERO,
    Op.JUMPI,
    Op.INVALID,
    Op.JUMPDEST,
  ]);
});

test("assertCaller checks a literal address against msg.sender", () => {
  const out = compile(assertCaller("0x1111111111111111111111111111111111111111"));

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(numberOps(out.code)).toEqual([
    Op.PUSH20,
    Op.CALLER,
    Op.EQ,
    Op.JUMPI,
    Op.INVALID,
    Op.JUMPDEST,
  ]);
});

test("assert rejects non-boolean expressions", () => {
  const word = Expression.fromFragment(new Fragment([], 0, [Word], [Op.PUSH0]));

  expect(() => compile(assert(word))).toThrow("bound fragment at position 1");
});

import { expect, test } from "bun:test";
import { assert, assertCaller } from "../common";
import { Expression, StackRef, get } from "../expression";
import { Fragment } from "../fragment";
import { Op } from "../opcodes";
import { Bool } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("assert packages literal boolean conditions", () => {
  const out = assert(true);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Bool) → 1|⊢");
  expect(out.children).toHaveLength(1);
  expect(out.children[0]).toBeInstanceOf(Expression);
  expect(String((out.children[0] as Expression).frag.signature))
    .toBe("() → 0|Bool");
  expect(numberOps(out.frag.code)).toEqual([
    Op.JUMPI,
    Op.STOP,
    Op.JUMPDEST,
  ]);
});

test("assert accepts named stack refs as expression children", () => {
  const out = assert(get("cond"));

  expect(out.children).toEqual([new StackRef("cond")]);
  expect(String(out.frag.signature)).toBe("(Bool) → 1|⊢");
});

test("assert accepts boolean expressions", () => {
  const cond = Expression.fromFragment(Fragment.from({
    ensure: [Bool],
    code: [Op.ISZERO],
  }));
  const out = assert(cond);

  expect(out.children).toEqual([cond]);
  expect(String(out.frag.signature)).toBe("(Bool) → 1|⊢");
  expect(numberOps(out.frag.code)).toEqual([
    Op.JUMPI,
    Op.STOP,
    Op.JUMPDEST,
  ]);
});

test("assertCaller checks a literal address against msg.sender", () => {
  const out = assertCaller("0x1111111111111111111111111111111111111111");

  expect(String(out.frag.signature)).toBe("(Bool) → 1|⊢");
  expect(out.children).toHaveLength(1);

  const eq = out.children[0] as Expression;
  expect(String(eq.frag.signature)).toBe("(, ) → 2|Bool");
  expect(numberOps(eq.frag.code)).toEqual([Op.EQ]);
  expect(eq.children).toHaveLength(2);
  expect(eq.children[0]).toBeInstanceOf(Expression);
  expect(numberOps((eq.children[1] as Expression).frag.code))
    .toEqual([Op.CALLER]);
});

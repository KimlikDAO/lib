import { expect, test } from "bun:test";
import { assert, assertCaller } from "../common";
import { Op } from "../opcodes";
import {
  Bool,
  Fragment,
  use,
  Word
} from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("assert binds literal boolean conditions", () => {
  const out = assert(true);

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(numberOps(out.code)).toEqual([
    Op.PUSH1,
    Op.JUMPI,
    Op.INVALID,
    Op.JUMPDEST,
  ]);
});

test("assert consumes a boolean from the source stack", () => {
  const out = assert(use(1));

  expect(String(out.signature())).toBe("(Bool) → 1|⊢");
  expect(numberOps(out.code)).toEqual([
    Op.JUMPI,
    Op.INVALID,
    Op.JUMPDEST,
  ]);
});

test("assert accepts boolean expressions", () => {
  const out = assert(new Fragment([], 0, [Bool], [Op.ISZERO]));

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(numberOps(out.code)).toEqual([
    Op.ISZERO,
    Op.JUMPI,
    Op.INVALID,
    Op.JUMPDEST,
  ]);
});

test("assertCaller checks a literal address against msg.sender", () => {
  const out = assertCaller("0x1111111111111111111111111111111111111111");

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
  const word = new Fragment([], 0, [Word], [Op.PUSH0]);

  expect(() => assert(word)).toThrow("bound fragment at position 1");
});

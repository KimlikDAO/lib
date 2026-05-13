import { expect, test } from "bun:test";
import { returnOrRevert, sload, sstore } from "../builtins";
import { Expression } from "../expression";
import { Op } from "../opcodes";
import { Addr } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("returnOrRevert emits a packaged conditional termination", () => {
  const out = returnOrRevert(true, 0, 1);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Size, Locn, Bool) → 3|⊢");
  expect(out.children).toHaveLength(3);
  expect(out.children.every((arg) => arg instanceof Expression)).toBe(true);
  expect(numberOps(out.frag.code)).toEqual([
    Op.JUMPI,
    Op.REVERT,
    Op.JUMPDEST,
    Op.RETURN,
  ]);
});

test("sstore returns an expression node", () => {
  const out = sstore(0, 1);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Data, Data) → 2|");
  expect(out.children).toHaveLength(2);
  expect(out.children.every((arg) => arg instanceof Expression)).toBe(true);
});

test("sload can specialize its output type", () => {
  const out = sload(0, Addr);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Data) → 1|Addr");
  expect(numberOps(out.frag.code)).toEqual([Op.SLOAD]);
});

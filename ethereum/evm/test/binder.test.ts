import { expect, test } from "bun:test";
import { bind } from "../binder";
import { Op } from "../opcodes";
import { dup, Expression, use } from "../syntax";
import { Addr, Fragment, Locn, Size, Word } from "../types";

test("bind fills generated arguments into a fragment", () => {
  const out = bind([1, 0], new Fragment([Size, Locn], 2, [], [Op.RETURN], "⊤"));

  expect(String(out.signature())).toBe("() → 0|⊤");
  expect(out.code).toEqual([
    Op.PUSH1,
    Uint8Array.of(1),
    Op.PUSH0,
    Op.RETURN,
  ]);
});

test("bind composes pure expression fragments", () => {
  const out = bind([
    Expression.fromFragment(new Fragment([], 0, [Word], [Op.ORIGIN])),
    Expression.fromFragment(new Fragment([], 0, [Word], [Op.ADDRESS])),
  ], new Fragment([Word, Word], 2, [], []));

  expect(String(out.signature())).toBe("() → 0|");
  expect(out.code).toEqual([Op.ORIGIN, Op.ADDRESS]);
});

test("bind checks generated fragment output type", () => {
  const addr = Expression.fromFragment(new Fragment([], 0, [Addr], [Op.ADDRESS]));

  expect(() => bind([addr, 0], new Fragment([Size, Locn], 2, [], [Op.RETURN], "⊤")))
    .toThrow("bound fragment at position 1");
});

test("bind rejects named stack refs until syntax binding is implemented", () => {
  expect(() => bind([use("size"), 0], new Fragment([Size, Locn], 2, [], [Op.RETURN], "⊤")))
    .toThrow("named stack refs are not implemented yet");
  expect(() => bind([dup("size"), 0], new Fragment([Size, Locn], 2, [], [Op.RETURN], "⊤")))
    .toThrow("named stack refs are not implemented yet");
});

test("bind lowers nested expressions recursively", () => {
  const expr = new Expression([], new Fragment([], 0, [Size], [Op.CALLDATASIZE]));
  const out = bind([expr, 0], new Fragment([Size, Locn], 2, [], [Op.RETURN], "⊤"));

  expect(String(out.signature())).toBe("() → 0|⊤");
  expect(out.code).toEqual([
    Op.CALLDATASIZE,
    Op.PUSH0,
    Op.RETURN,
  ]);
});

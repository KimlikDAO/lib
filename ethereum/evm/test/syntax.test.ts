import { expect, test } from "bun:test";
import { Op } from "../opcodes";
import { Expression, set, use } from "../syntax";
import { Addr, Bool, Fragment, Locn, Size, Word } from "../types";

test("Expression keeps nested expression and stack-ref leaves", () => {
  const child = new Expression([], new Fragment([], 0, [Addr], []));
  const expr = new Expression(
    [child, use("x")],
    new Fragment([Addr, Addr], 0, [Bool], [Op.EQ]),
  );

  expect(expr.args[0]).toBe(child);
  expect(expr.args[1]).toEqual(use("x"));
  expect(String(expr.frag.signature())).toBe("(Addr, Addr) → 0|Bool");
});

test("Expression converts literal leaves into closed expressions", () => {
  const expr = new Expression(
    [0, use("x")],
    new Fragment([Locn, Locn], 0, [Bool], [Op.EQ]),
  );

  expect(expr.args[0]).toBeInstanceOf(Expression);
  expect(String((expr.args[0] as Expression).frag.signature())).toBe("() → 0|Locn");
  expect(expr.args[1]).toEqual(use("x"));
});

test("Expression checks total child arity against expected inputs", () => {
  const pair = new Expression([], new Fragment([], 0, [Word, Word], []));

  expect(() => new Expression([pair], new Fragment([Word], 0, [Bool], [Op.ISZERO])))
    .toThrow("Expression expected 1 child values, received 2");
});

test("Expression.fromLit creates closed literal expressions", () => {
  const expr = Expression.fromLit(0, Size);

  expect(String(expr.frag.signature())).toBe("() → 0|Size");
  expect(expr.args).toEqual([]);
});

test("set renames ensured expression values", () => {
  const expr = set("x", new Expression([], new Fragment([], 0, [Size], [Op.CALLDATASIZE])));

  expect(expr).toBeInstanceOf(Expression);
  expect(String(expr.frag.signature())).toBe("() → 0|x: Size");
});

test("set requires an explicit type for literals", () => {
  const expr = set("loc", Locn, 0);
  const setUntyped = set as unknown as (name: string, lit: number) => Expression;

  expect(String(expr.frag.signature())).toBe("() → 0|loc: Locn");
  expect(() => setUntyped("loc", 0)).toThrow("set(loc) requires a type for literals");
});

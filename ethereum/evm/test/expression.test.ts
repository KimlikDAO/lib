import { expect, test } from "bun:test";
import { Expression, get } from "../expression";
import { Fragment } from "../fragment";
import { Op } from "../opcodes";
import { Addr, Bool, Locn, Size, Word } from "../types";

test("Expression keeps nested expression and stack-ref leaves", () => {
  const child = new Expression([], Fragment.from({ ensure: [Addr] }));
  const ref = get("x");
  const expr = new Expression(
    [child, ref],
    Fragment.from({
      expect: [Addr, Addr],
      pop: 2,
      ensure: [Bool],
      code: [Op.EQ],
    }),
  );

  expect(expr.children[0]).toBe(child);
  expect(expr.children[1]).toEqual(ref);
  expect(String(expr.frag.signature)).toBe("(Addr, Addr) → 2|Bool");
});

test("Expression converts literal leaves into closed expressions", () => {
  const ref = get("x");
  const expr = new Expression(
    [0, ref],
    Fragment.from({
      expect: [Locn, Locn],
      pop: 2,
      ensure: [Bool],
      code: [Op.EQ],
    }),
  );

  expect(expr.children[0]).toBeInstanceOf(Expression);
  expect(String((expr.children[0] as Expression).frag.signature))
    .toBe("() → 0|Locn");
  expect(expr.children[1]).toEqual(ref);
});

test("Expression checks total child arity against expected inputs", () => {
  const pair = new Expression([], Fragment.from({ ensure: [Word, Word] }));

  expect(() => new Expression(
    [pair],
    Fragment.from({
      expect: [Word],
      pop: 1,
      ensure: [Bool],
      code: [Op.ISZERO],
    }),
  )).toThrow("Expression expected 1 child values, received 2");
});

test("Expression rejects fragments that do not consume their child window", () => {
  expect(() => new Expression(
    [get("x")],
    Fragment.from({
      expect: [Word],
      pop: 0,
      ensure: [Bool],
    }),
  )).toThrow("Expression fragment pop 0 does not match expect length 1");
});

test("Expression checks nested expression output types", () => {
  const child = new Expression([], Fragment.from({ ensure: [Word] }));

  expect(() => new Expression(
    [child],
    Fragment.from({
      expect: [Addr],
      pop: 1,
      ensure: [Bool],
    }),
  )).toThrow("Expression child at position 1: expected Addr, received Word");
});

test("Expression.fromLiteral creates closed literal expressions", () => {
  const expr = Expression.fromLiteral(0, Size);

  expect(String(expr.frag.signature)).toBe("() → 0|Size");
  expect(expr.children).toEqual([]);
});

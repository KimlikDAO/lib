import { expect, test } from "bun:test";
import { compose } from "../composer";
import { Op } from "../opcodes";
import { Ops } from "../ops";
import {
  Addr,
  Bool,
  Data,
  EvmType,
  FlatCode,
  Fragment,
  HaltState,
  Locn,
  Size,
  TypeList,
  Uint,
  Weis,
  Word,
} from "../types";

const fragment = (
  expect: readonly EvmType[],
  ensure: TypeList,
  pop: number,
  code: FlatCode = [],
  halt?: HaltState,
  ensureNames?: readonly (string |undefined)[],
): Fragment => new Fragment(expect, pop, ensure, code, halt, ensureNames);

test("composes no fragments into an identity fragment", () => {
  const out = compose();
  expect(String(out.signature())).toBe("() → 0|");
  expect(out.code).toEqual([]);
});

test("uses produced stack values to satisfy later expectations", () => {
  const out = compose(
    fragment([], [Weis, Addr], 0, [Op.ADDRESS]),
    fragment([Addr], [Bool], 1, [Op.ISZERO]),
  );

  expect(String(out.signature())).toBe("() → 0|Weis, Bool");
  expect(out.code).toEqual([Op.ADDRESS, Op.ISZERO]);
});

test("preserves names on surviving ensured stack items", () => {
  const out = compose(
    fragment([], [Weis, Addr], 0, [], undefined, ["value", "owner"]),
    fragment([Addr], [Bool], 1, [Op.ISZERO]),
  );

  expect(String(out.signature())).toBe("() → 0|value: Weis, Bool");
});

test("appends ensured names correctly with holes on both sides", () => {
  const out = compose(
    fragment([], [Weis, Addr], 0, [], undefined, ["value", undefined]),
    fragment([Addr], [Bool, Size], 1, [], undefined, [undefined, "len"]),
  );

  expect(out.ensureNames).toEqual(["value", undefined, "len"]);
  expect(String(out.signature())).toBe("() → 0|value: Weis, Bool, len: Size");
});

test("translates later expectations through produced stack values", () => {
  const out = compose(
    fragment([Bool], [Addr], 1, []),
    fragment([Locn, Word], [Word], 2, []),
  );

  expect(String(out.signature())).toBe("(Locn, Bool) → 2|");
});

test("merges compatible expectations on the original stack", () => {
  const out = compose(
    fragment([Size, Word, Word], [], 0, []),
    fragment([Word], [Bool], 1, []),
  );

  expect(String(out.signature())).toBe("(Size, , ) → 1|Bool");
});

test("rejects incompatible expectations on the original stack", () => {
  expect(() => compose(
    fragment([Data], [], 0, []),
    fragment([Addr], [Bool], 1, []),
  )).toThrow("conflicting expectation at stack position 1");
});

test("rejects expectations incompatible with produced values", () => {
  expect(() => compose(
    fragment([], [Addr], 0, []),
    fragment([Bool], [Word], 1, []),
  )).toThrow("fragment output at stack position 1");
});

test("rejects narrower produced values where later code expects wider ones", () => {
  expect(() => compose(
    fragment([], [Uint, Uint], 0, []),
    fragment([Locn, Size], [Bool], 2, []),
  )).toThrow("fragment output at stack position 1");
});

test("accepts subtype outputs for specialized opcode expectations", () => {
  const out = compose(
    fragment([], [Size, Locn], 0, []),
    Ops[Op.ADD]!,
  );

  expect(String(out.signature())).toBe("() → 0|Uint");
});

test("termination preserves following code without changing signature", () => {
  const out = compose(
    fragment([Size, Locn], [], 2, [Op.RETURN], "⊤"),
    fragment([], [Addr], 0, [Op.ADDRESS]),
  );

  expect(String(out.signature())).toBe("(Size, Locn) → 2|⊤");
  expect(out.code).toEqual([Op.RETURN, Op.ADDRESS]);
});

test("compose is associative for linear fragments", () => {
  const f = fragment([Size, Word, Bool], [Locn, Addr], 1, [Op.ADDRESS]);
  const g = fragment([Weis, Locn, Addr], [Word], 3, [Op.ADD]);
  const h = fragment([Addr, Word, Word], [Bool, Size], 1, [Op.MUL]);

  const left = compose(compose(f, g), h);
  const right = compose(f, compose(g, h));

  expect(String(left.signature())).toBe("(Addr, Size, Weis, Bool) → 2|Bool, Size");
  expect(String(right.signature())).toBe(String(left.signature()));
  expect(right.code).toEqual(left.code);
});

import { expect, test } from "bun:test";
import { compose } from "../composer";
import { Op } from "../opcodes";
import {
  Addr,
  Bool,
  Data,
  EvmType,
  FlatCode,
  Fragment,
  Locn,
  Size,
  Weis,
  Word,
} from "../types";

const frag = (
  expect: readonly EvmType[],
  ensure: readonly EvmType[],
  pop: number,
  code: FlatCode = [],
): Fragment => new Fragment(expect, ensure, pop, code);

test("composes no fragments into an identity fragment", () => {
  const out = compose();
  expect(String(out.signature())).toBe("() → |0");
  expect(out.code).toEqual([]);
});

test("uses produced stack values to satisfy later expectations", () => {
  const out = compose(
    frag([], [Addr, Weis], 0, [Op.ADDRESS]),
    frag([Addr], [Bool], 1, [Op.ISZERO]),
  );

  expect(String(out.signature())).toBe("() → Bool, Weis|0");
  expect(out.code).toEqual([Op.ADDRESS, Op.ISZERO]);
});

test("translates later expectations through produced stack values", () => {
  const out = compose(
    frag([Bool], [Addr], 1),
    frag([Word, Locn], [Word], 2),
  );

  expect(String(out.signature())).toBe("(Bool, Locn) → |2");
});

test("merges compatible expectations on the original stack", () => {
  const out = compose(
    frag([Word, Word, Size], [], 0),
    frag([Word], [Bool], 1),
  );

  expect(String(out.signature())).toBe("(, , Size) → Bool|1");
});

test("rejects incompatible expectations on the original stack", () => {
  expect(() => compose(
    frag([Data], [], 0),
    frag([Addr], [Bool], 1),
  )).toThrow("conflicting expectation at stack position 1");
});

test("rejects expectations incompatible with produced values", () => {
  expect(() => compose(
    frag([], [Addr], 0),
    frag([Bool], [Word], 1),
  )).toThrow("fragment output at stack position 1");
});

test("compose is associative for linear fragments", () => {
  const f = frag([Bool, Word, Size], [Addr, Locn], 1, [Op.ADDRESS]);
  const g = frag([Addr, Locn, Weis], [Word], 3, [Op.ADD]);
  const h = frag([Word, Word, Addr], [Size, Bool], 1, [Op.MUL]);

  const left = compose(compose(f, g), h);
  const right = compose(f, compose(g, h));

  expect(String(left.signature())).toBe("(Bool, Weis, Size, Addr) → Size, Bool|2");
  expect(String(right.signature())).toBe(String(left.signature()));
  expect(right.code).toEqual(left.code);
});

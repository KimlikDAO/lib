import { expect, test } from "bun:test";
import { Op, PUSHN, SWAPN } from "../opcodes";
import { Expression } from "../syntax";
import {
  Addr,
  Bool,
  Data,
  Fragment,
  Locn,
  Signature,
  Size,
  Weis,
  Word
} from "../types";

test("stringifies empty signatures", () => {
  expect(String(new Signature([], [], 0))).toBe("() → 0|");
});

test("stringifies all stack types", () => {
  expect(String(new Signature(
    [],
    [Bool, Size, Locn, Addr, Weis, Data, Word],
    0,
    undefined,
    ["ok", undefined, undefined, "owner", undefined, undefined, undefined],
  ))).toBe("() → 0|ok: Bool, Size, Locn, owner: Addr, Weis, Data, ");
});

test("stringifies Word expectations as gaps", () => {
  expect(String(new Signature(
    [Locn, Word, Word, Bool],
    [Size, Addr],
    1,
    undefined,
    ["size", "addr"],
  ))).toBe("(Locn, , , Bool) → 1|size: Size, addr: Addr");
});

test("stringifies halted signatures", () => {
  expect(String(new Signature([Locn, Size], [], 2, "⊣")))
    .toBe("(Locn, Size) → 2|⊣");
  expect(String(new Signature([], [], 0, "⊥"))).toBe("() → 0|⊥");
  expect(String(new Signature([], [], 0, "⊤"))).toBe("() → 0|⊤");
  expect(String(new Signature([], [], 0, "⊢"))).toBe("() → 0|⊢");
});

test("stringifies halted signatures with ensured values", () => {
  expect(String(new Signature([], [Addr], 0, "⊢")))
    .toBe("() → 0|Addr, ⊢");
});

test("stringifies ensured names", () => {
  expect(String(new Signature([], [Bool, Addr], 0, undefined, ["ok", "owner"])))
    .toBe("() → 0|ok: Bool, owner: Addr");
});

test("stringifies named Word ensures as bare names", () => {
  expect(String(new Signature([], [Word, Addr], 0, undefined, ["x", "owner"])))
    .toBe("() → 0|x, owner: Addr");
});

test("fragment constructor validates pop invariants", () => {
  expect(() => new Fragment([], 0.5, [], []))
    .toThrow("Fragment pop must be an integer, received 0.5");
  expect(() => new Fragment([], -2, [], []))
    .toThrow("Fragment pop must be -1 or non-negative, received -2");
  expect(() => new Fragment([Word], 2, [], []))
    .toThrow("Fragment pop 2 exceeds expect length 1");
  expect(() => new Fragment([], 0, [Word], [], undefined, []))
    .toThrow("Fragment ensureNames length 0 does not match ensure length 1");
});

test("address byte literals emit the shortest push", () => {
  const bytes = new Uint8Array(20);
  const suffix = Uint8Array.fromHex("11111111111111111111111111111111");
  bytes.set(suffix, 4);

  expect(Expression.fromLit(bytes, Addr).frag.code)
    .toEqual([PUSHN(16), suffix]);
});

test("address string literals emit the shortest push", () => {
  expect(Expression.fromLit(
    "0x0000000011111111111111111111111111111111",
    Addr,
  ).frag.code).toEqual([
    PUSHN(16),
    Uint8Array.fromHex("11111111111111111111111111111111"),
  ]);
});

test("zero address literals emit PUSH0", () => {
  expect(Expression.fromLit(new Uint8Array(20), Addr).frag.code)
    .toEqual([Op.PUSH0]);
});

test("address byte literals must still be 20 bytes", () => {
  expect(() => Expression.fromLit(new Uint8Array(19), Addr))
    .toThrow("Byte length must be 20 for Addr literal");
});

test("address string literals must still be 20 bytes", () => {
  expect(() => Expression.fromLit("0x1111", Addr))
    .toThrow("Expected a length 42 address starting in 0x");
});

test("data byte literals emit the shortest push", () => {
  expect(Expression.fromLit(Uint8Array.from([0, 0, 0x12]), Data).frag.code)
    .toEqual([Op.PUSH1, Uint8Array.from([0x12])]);
});

test("swap helper derives SWAP opcode", () => {
  expect(SWAPN(1)).toBe(Op.SWAP1);
  expect(SWAPN(16)).toBe(Op.SWAP16);
  expect(() => SWAPN(17)).toThrow("SWAP expects 1..16");
});

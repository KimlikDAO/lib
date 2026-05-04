import { expect, test } from "bun:test";
import { Op, pushN } from "../opcodes";
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
  expect(String(new Signature([], [Bool, Size, Locn, Addr, Weis, Data, Word], 0)))
    .toBe("() → 0|Bool, Size, Locn, Addr, Weis, Data, ");
});

test("stringifies Word expectations as gaps", () => {
  expect(String(new Signature([Locn, Word, Word, Bool], [Size, Addr], 1)))
    .toBe("(Locn, , , Bool) → 1|Size, Addr");
});

test("stringifies terminating signatures", () => {
  expect(String(new Signature([Locn, Size], "⊣", 2)))
    .toBe("(Locn, Size) → 2|⊣");
  expect(String(new Signature([], "⊥", 0))).toBe("() → 0|⊥");
  expect(String(new Signature([], "⊤", 0))).toBe("() → 0|⊤");
});

test("stringifies failing signatures", () => {
  expect(String(new Signature([Locn, Size], "⊥", 2)))
    .toBe("(Locn, Size) → 2|⊥");
});

test("address byte literals emit the shortest push", () => {
  const bytes = new Uint8Array(20);
  const suffix = Uint8Array.fromHex("11111111111111111111111111111111");
  bytes.set(suffix, 4);

  expect(Fragment.fromLit(bytes, Addr).code)
    .toEqual([pushN(16), suffix]);
});

test("address string literals emit the shortest push", () => {
  expect(Fragment.fromLit(
    "0x0000000011111111111111111111111111111111",
    Addr,
  ).code).toEqual([
    pushN(16),
    Uint8Array.fromHex("11111111111111111111111111111111"),
  ]);
});

test("zero address literals emit PUSH0", () => {
  expect(Fragment.fromLit(new Uint8Array(20), Addr).code)
    .toEqual([Op.PUSH0]);
});

test("address byte literals must still be 20 bytes", () => {
  expect(() => Fragment.fromLit(new Uint8Array(19), Addr))
    .toThrow("Byte length must be 20 for AddrLit");
});

test("address string literals must still be 20 bytes", () => {
  expect(() => Fragment.fromLit("0x1111", Addr))
    .toThrow("Expected a length 42 address starting in 0x");
});

test("data byte literals emit the shortest push", () => {
  expect(Fragment.fromLit(Uint8Array.from([0, 0, 0x12]), Data).code)
    .toEqual([Op.PUSH1, Uint8Array.from([0x12])]);
});

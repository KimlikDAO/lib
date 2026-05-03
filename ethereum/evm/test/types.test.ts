import { expect, test } from "bun:test";
import { Addr, Bool, Locn, Signature, Size, Weis, Word } from "../types";

test("stringifies empty signatures", () => {
  expect(String(new Signature([], [], 0))).toBe("() → |0");
});

test("stringifies all stack types by name", () => {
  expect(String(new Signature([], [Word, Weis, Addr, Locn, Size, Bool], 0)))
    .toBe("() → Word, Weis, Addr, Locn, Size, Bool|0");
});

test("stringifies gapped expectations", () => {
  expect(String(new Signature([Bool, , , Locn], [Addr, Size], 1)))
    .toBe("(Bool, , , Locn) → Addr, Size|1");
});

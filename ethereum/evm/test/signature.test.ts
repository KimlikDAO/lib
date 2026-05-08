import { expect, test } from "bun:test";
import { Signature, compose } from "../signature";
import { Addr, Bool, Locn, Size, Weis } from "../types";

test("parses compact named signatures", () => {
  const out = Signature.from("(Word, Word)->0|x:Word,y:Addr");

  expect(String(out)).toBe("(, ) → 0|x, y: Addr");
});

test("parses printed signatures with gaps and names", () => {
  const out = Signature.from("(Locn, , , Bool) → 1|size: Size, addr: Addr");

  expect(String(out)).toBe("(Locn, , , Bool) → 1|size: Size, addr: Addr");
});

test("parses halt-only signatures", () => {
  const out = Signature.from("() → 0|⊤");

  expect(String(out)).toBe("() → 0|⊤");
});

test("composes stack effects without code", () => {
  const out = compose(
    new Signature([], 0, [Weis, Addr], ["value", "owner"]),
    new Signature([Addr], 1, [Bool]),
  );

  expect(String(out)).toBe("() → 0|value: Weis, Bool");
});

test("compose stops signature updates after halt", () => {
  const out = compose(
    new Signature([Size, Locn], 2, [], [], "⊤"),
    new Signature([], 0, [Addr]),
  );

  expect(String(out)).toBe("(Size, Locn) → 2|⊤");
});

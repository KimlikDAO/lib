import { expect, test } from "bun:test";
import { signature } from "../signatures";

test("parses compact named signatures", () => {
  const out = signature("(Word, Word)->0|x:Word,y:Addr");

  expect(String(out)).toBe("(, ) → 0|x, y: Addr");
});

test("parses printed signatures with gaps and names", () => {
  const out = signature("(Locn, , , Bool) → 1|size: Size, addr: Addr");

  expect(String(out)).toBe("(Locn, , , Bool) → 1|size: Size, addr: Addr");
});

test("parses halt-only signatures", () => {
  const out = signature("() → 0|⊤");

  expect(String(out)).toBe("() → 0|⊤");
});

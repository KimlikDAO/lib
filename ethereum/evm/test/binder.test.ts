import { expect, test } from "bun:test";
import { bind } from "../binder";
import { Op, dupN } from "../opcodes";
import { Ops } from "../ops";
import {
  Addr,
  Fragment,
  Locn,
  Word,
  eat,
  get,
  use,
} from "../types";

test("bind fills generated arguments into a fragment", () => {
  const out = bind([1, 0], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("() → 0|⊤");
  expect(out.code).toEqual([
    Op.PUSH1,
    Uint8Array.of(1),
    Op.PUSH0,
    Op.RETURN,
  ]);
});

test("bind supports one get among generated arguments", () => {
  const source = new Fragment([], 0, [Locn], [Op.PC]);
  const out = bind([get(1), source, 0], Ops[Op.CODECOPY]!);

  expect(String(out.signature())).toBe("(Size) → 0|");
  expect(out.code).toEqual([
    dupN(1),
    Op.PC,
    Op.PUSH0,
    Op.CODECOPY,
  ]);
});

test("bind supports one use among generated arguments", () => {
  const out = bind([use(1), 0], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Size) → 1|⊤");
  expect(out.code).toEqual([Op.PUSH0, Op.RETURN]);
});

test("bind moves one use past generated arguments", () => {
  const out = bind([0, use(1)], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Locn) → 1|⊤");
  expect(out.code).toEqual([Op.PUSH0, Op.SWAP1, Op.RETURN]);
});

test("bind supports one eat among generated arguments", () => {
  const out = bind([eat(1), 0], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Size) → 1|⊤");
  expect(out.code).toEqual([Op.PUSH0, Op.RETURN]);
});

test("bind supports all-get arguments", () => {
  const out = bind([get(2), get(1)], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Size, Locn) → 0|⊤");
  expect(out.code).toEqual([dupN(2), dupN(2), Op.RETURN]);
});

test("bind rejects unsupported mixed stackref patterns", () => {
  expect(() => bind([get(1), use(2)], Ops[Op.RETURN]!))
    .toThrow("unsupported bind pattern");
  expect(() => bind([use(2), use(1)], Ops[Op.RETURN]!))
    .toThrow("unsupported bind pattern");
});

test("bind checks generated fragment output type", () => {
  const addr = new Fragment([], 0, [Addr], [Op.ADDRESS]);

  expect(() => bind([addr, 0], Ops[Op.RETURN]!))
    .toThrow("bound fragment at position 1");
});

test("bind requires full expect binding", () => {
  expect(() => bind([0], Ops[Op.RETURN]!))
    .toThrow("bind expected 2 arguments");
});

test("bind rejects blank for concrete slots", () => {
  expect(() => bind([, 0], Ops[Op.RETURN]!))
    .toThrow("blank argument requires Word");
});

test("bind fills Word blanks with PUSH0", () => {
  const f = new Fragment([Word], 1, [], [Op.POP]);
  const out = bind([,], f);

  expect(String(out.signature())).toBe("() → 0|");
  expect(out.code).toEqual([Op.PUSH0, Op.POP]);
});

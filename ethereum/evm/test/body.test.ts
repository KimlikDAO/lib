import { expect, test } from "bun:test";
import { sstore } from "../builtins";
import { Expression, get } from "../expression";
import { Fragment, LabelPos } from "../fragment";
import { Op } from "../opcodes";
import { Ops } from "../ops";
import { body } from "../body";
import { blob, label, set } from "../statement";
import { Uint } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("body binds statements left to right with future keep names", () => {
  const frag = body(
    set("x", Uint, 1),
    set("y", new Expression([get("x"), 2], Ops[Op.ADD]!)),
  );

  expect(String(frag.signature)).toBe("() → 0|y: Uint");
  expect(numberOps(frag.code)).toEqual([Op.PUSH1, Op.PUSH1, Op.ADD]);
});

test("body can set through a typed stack ref target", () => {
  const x = get("x", Uint);
  const frag = body(
    set(x, Uint, 1),
    set(x, new Expression([x, 2], Ops[Op.ADD]!)),
  );

  expect(String(frag.signature)).toBe("() → 0|x: Uint");
  expect(numberOps(frag.code)).toEqual([Op.PUSH1, Op.PUSH1, Op.ADD]);
});

test("body reassignment erases the previous target name", () => {
  const x = get("x", Uint);
  const frag = body(
    set(x, Uint, 1),
    set(x, Uint, 2),
  );

  expect(String(frag.signature)).toBe("() → 0|Uint, x: Uint");
  expect(numberOps(frag.code)).toEqual([Op.PUSH1, Op.PUSH1]);
});

test("body erases names from plain expression statements", () => {
  const expr = Expression.fromFragment(Fragment.from({
    ensure: [Uint],
    ensureNames: ["x"],
    code: [Op.PUSH0],
  }));
  const frag = body([expr]);

  expect(frag.signature.ensureNames).toEqual([undefined]);
});

test("body accepts recursive bodies", () => {
  const frag = body([
    set("x", Uint, 1),
    [
      set("y", new Expression([get("x"), 2], Ops[Op.ADD]!)),
    ],
  ]);

  expect(String(frag.signature)).toBe("() → 0|y: Uint");
  expect(numberOps(frag.code)).toEqual([Op.PUSH1, Op.PUSH1, Op.ADD]);
});

test("body binds zero-output expression statements", () => {
  const frag = body(sstore(0, 1));

  expect(String(frag.signature)).toBe("() → 0|");
  expect(numberOps(frag.code)).toEqual([
    Op.PUSH1,
    Op.PUSH0,
    Op.SSTORE,
  ]);
});

test("body emits labels and blobs into flat code", () => {
  const pos = label("pos");
  const data = blob(Uint8Array.from([1, 2]), "data");
  const frag = body([pos, data]);

  expect(frag.code[0]).toBeInstanceOf(LabelPos);
  expect((frag.code[0] as LabelPos).labelId).toBe(pos.id);
  expect(frag.code[1]).toBeInstanceOf(LabelPos);
  expect((frag.code[1] as LabelPos).labelId).toBe(data.label.id);
  expect(frag.code[2]).toEqual(data.data);
});

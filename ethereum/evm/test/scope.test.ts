import { expect, test } from "bun:test";
import { sstore } from "../builtins";
import { Expression, get } from "../expression";
import { Fragment, LabelPos } from "../fragment";
import { Op } from "../opcodes";
import { Ops } from "../ops";
import { scope } from "../scope";
import { blob, label, set } from "../statement";
import { Uint } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("scope binds statements left to right with future keep names", () => {
  const frag = scope(
    set("x", Uint, 1),
    set("y", new Expression([get("x"), 2], Ops[Op.ADD]!)),
  );

  expect(String(frag.signature)).toBe("() → 0|y: Uint");
  expect(numberOps(frag.code)).toEqual([Op.PUSH1, Op.PUSH1, Op.ADD]);
});

test("scope erases names from plain expression statements", () => {
  const expr = Expression.fromFragment(Fragment.from({
    ensure: [Uint],
    ensureNames: ["x"],
    code: [Op.PUSH0],
  }));
  const frag = scope([expr]);

  expect(frag.signature.ensureNames).toEqual([undefined]);
});

test("scope binds zero-output expression statements", () => {
  const frag = scope(sstore(0, 1));

  expect(String(frag.signature)).toBe("() → 0|");
  expect(numberOps(frag.code)).toEqual([
    Op.PUSH1,
    Op.PUSH0,
    Op.SSTORE,
    Op.PUSH0,
  ]);
});

test("scope emits labels and blobs into flat code", () => {
  const pos = label("pos");
  const data = blob(Uint8Array.from([1, 2]), "data");
  const frag = scope([pos, data]);

  expect(frag.code[0]).toBeInstanceOf(LabelPos);
  expect((frag.code[0] as LabelPos).labelId).toBe(pos.id);
  expect(frag.code[1]).toBeInstanceOf(LabelPos);
  expect((frag.code[1] as LabelPos).labelId).toBe(data.label.id);
  expect(frag.code[2]).toEqual(data.data);
});

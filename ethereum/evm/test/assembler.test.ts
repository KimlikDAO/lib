import { expect, test } from "bun:test";
import { assemble } from "../assembler";
import { createUpgradableProxy } from "../recipes/proxies";
import { Fragment, LabelPos, LabelRef } from "../fragment";
import { Op } from "../opcodes";
import { label, set } from "../statement";
import { Uint } from "../types";

test("assemble serializes flat opcode and data atoms", () => {
  const program = assemble(Fragment.from({
    code: [Op.PUSH1, Uint8Array.from([0x2a])],
  }));

  expect([...program]).toEqual([Op.PUSH1, 0x2a]);
});

test("assemble accepts statement inputs through scope", () => {
  expect([...assemble(set("x", Uint, 0))]).toEqual([Op.PUSH0]);
});

test("assemble builds the upgradable proxy recipe", () => {
  const addr = "0x1111111111111111111111111111111111111111";
  const slot = Uint8Array.from(Array(32).fill(1));

  expect(createUpgradableProxy(addr, slot).length).toBeGreaterThan(0);
});

test("assemble resolves jump labels by fixed point", () => {
  const dest = label("dest");
  const program = assemble(Fragment.from({
    code: [
      new LabelRef(dest.id, true),
      Op.JUMP,
      new LabelPos(dest.id),
      Op.JUMPDEST,
    ],
  }));

  expect([...program]).toEqual([Op.PUSH1, 3, Op.JUMP, Op.JUMPDEST]);
});

test("assemble grows label refs until addresses stabilize", () => {
  const dest = label("far");
  const program = assemble(Fragment.from({
    code: [
      new LabelRef(dest.id, true),
      Op.JUMP,
      ...Array(254).fill(Op.STOP),
      new LabelPos(dest.id),
      Op.JUMPDEST,
    ],
  }));

  expect(program[0]).toBe(Op.PUSH2);
  expect(program[1]).toBe(0x01);
  expect(program[2]).toBe(0x02);
  expect(program[0x0102]).toBe(Op.JUMPDEST);
});

test("assemble rejects unsatisfied fragment expectations", () => {
  expect(() => assemble(Fragment.from({
    expect: [Uint],
    pop: 0,
    code: [Op.POP],
  }))).toThrow("Can only assemble fulfilled fragments");
});

test("assemble rejects unresolved and invalid jump labels", () => {
  expect(() => assemble(Fragment.from({
    code: [new LabelRef(1_000_000, false)],
  }))).toThrow("was referenced but never placed");

  const bad = label("bad");
  expect(() => assemble(Fragment.from({
    code: [
      new LabelRef(bad.id, true),
      new LabelPos(bad.id),
    ],
  }))).toThrow("does not point to a JUMPDEST");
});

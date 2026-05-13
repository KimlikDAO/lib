import { expect, test } from "bun:test";
import {
  batchSend,
  batchSendFixedAmount,
  fixedAmountStatements,
} from "../recipes/batchSend";
import { assemble } from "../assembler";
import { Op } from "../opcodes";

const addr = (byte: number): `0x${string}` =>
  `0x${byte.toString(16).padStart(2, "0").repeat(20)}`;

const hasDup = (program: Uint8Array): boolean =>
  program.some((op) => Op.DUP1 <= op && op <= Op.DUP16);

const pushedAddresses = (program: Uint8Array): string[] => {
  const out: string[] = [];
  for (let pc = 0; pc < program.length; ++pc) {
    if (program[pc] != Op.PUSH20) continue;
    out.push("0x" + [...program.slice(pc + 1, pc + 21)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""));
    pc += 20;
  }
  return out;
}

test("fixedAmountStatements chooses direct calls for singleton groups", () => {
  const stmts = fixedAmountStatements([addr(1)], 1n);
  const program = assemble(stmts);

  expect(stmts).toHaveLength(1);
  expect(hasDup(program)).toBe(false);
});

test("fixedAmountStatements reuses amount for repeated groups", () => {
  const program = batchSendFixedAmount([addr(1), addr(2)], 1n);

  expect(hasDup(program)).toBe(true);
});

test("batchSend sorts recipients by amount before unrolling groups", () => {
  const program = batchSend([
    { address: addr(3), amount: 2n },
    { address: addr(1), amount: 1n },
    { address: addr(2), amount: 1n },
  ]);

  expect(pushedAddresses(program)).toEqual([addr(1), addr(2), addr(3)]);
});

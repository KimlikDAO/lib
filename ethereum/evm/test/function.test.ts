import { expect, test } from "bun:test";
import { assemble } from "../assembler";
import { keccak256, mstore, sub } from "../builtins";
import { get } from "../expression";
import { inline } from "../function";
import { Op } from "../opcodes";
import { set } from "../statement";
import { Data, Uint } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("inline creates an expression builder from named params", () => {
  const dec = inline({ x: Uint }, ({ x }) => sub(x, 1));
  const expr = dec(3);

  expect(String(expr.frag.signature)).toBe("(Uint) → 1|Uint");
  expect(numberOps(expr.frag.code)).toContain(Op.SUB);
  expect([...assemble(set("y", expr))]).toContain(Op.SUB);
});

test("inline compiles body statements with the last expression as return", () => {
  const hash = inline(
    { offset: Uint, value: Data },
    ({ offset, value }) => [
      mstore(offset, value),
      keccak256(0, 32),
    ],
  );
  const expr = hash(get("offset"), get("value"));

  expect(String(expr.frag.signature)).toBe("(Uint, Data) → 2|Data");
  expect(numberOps(expr.frag.code)).toEqual([
    Op.DUP2,
    Op.MSTORE,
    Op.PUSH1,
    Op.PUSH0,
    Op.SHA3,
    Op.SWAP1,
    Op.POP,
  ]);
});

test("inline body must end with a single-output expression", () => {
  expect(() => inline({ x: Uint }, ({ x }) => [
    set("y", x),
  ])).toThrow("inline body must end with an expression");
});

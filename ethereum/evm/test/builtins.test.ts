import { expect, test } from "bun:test";
import { assemble } from "../assembler";
import {
  bitAnd,
  calldataLoad,
  eq,
  keccak256,
  mstore,
  mul,
  range,
  returnOrRevert,
  shr,
  sload,
  sstore,
  sub,
} from "../builtins";
import { shr as evalShr } from "../eval/builtins";
import { Expression, get } from "../expression";
import { Op } from "../opcodes";
import { set } from "../statement";
import { Addr, Uint } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

test("returnOrRevert emits a packaged conditional termination", () => {
  const out = returnOrRevert(true, 0, 1);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Size, Locn, Bool) → 3|⊢");
  expect(out.children).toHaveLength(3);
  expect(out.children.every((arg) => arg instanceof Expression)).toBe(true);
  expect(numberOps(out.frag.code)).toEqual([
    Op.JUMPI,
    Op.REVERT,
    Op.JUMPDEST,
    Op.RETURN,
  ]);
});

test("sstore returns an expression node", () => {
  const out = sstore(0, 1);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Data, Data) → 2|");
  expect(out.children).toHaveLength(2);
  expect(out.children.every((arg) => arg instanceof Expression)).toBe(true);
});

test("sload can specialize its output type", () => {
  const out = sload(0, Addr);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Data) → 1|Addr");
  expect(numberOps(out.frag.code)).toEqual([Op.SLOAD]);
});

test("calldataLoad can specialize its output type", () => {
  const out = calldataLoad(0, Uint);

  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature)).toBe("(Locn) → 1|Uint");
  expect(numberOps(out.frag.code)).toEqual([Op.CALLDATALOAD]);
});

test("range follows Python-style stop, start-stop, and step forms", () => {
  expect(range(4)).toEqual([0, 1, 2, 3]);
  expect(range(2, 6)).toEqual([2, 3, 4, 5]);
  expect(range(2, 9, 3)).toEqual([2, 5, 8]);
  expect(range(5, 1, -2)).toEqual([5, 3]);
  expect(range(1, 5, -1)).toEqual([]);
  expect(() => range(0, 1, 0)).toThrow("range step cannot be 0");
});

test("arithmetic and memory helpers expose small expression fragments", () => {
  expect(String(bitAnd(get("x"), 1).frag.signature))
    .toBe("(Uint, Uint) → 2|Uint");
  expect(String(mul(get("x"), 32).frag.signature))
    .toBe("(Uint, Uint) → 2|Uint");
  const out = shr(1, get("x"));
  expect(out).toBeInstanceOf(Expression);
  expect(String(out.frag.signature))
    .toBe("(Uint, Uint) → 2|Uint");
  expect(String(eq(get("x"), get("y")).frag.signature))
    .toBe("(, ) → 2|Bool");
  expect(String(mstore(0, get("x")).frag.signature))
    .toBe("(, Uint) → 2|");
  expect(String(keccak256(0, 64).frag.signature))
    .toBe("(Size, Uint) → 2|Data");
});

test("eval shr runs directly on small JS values", () => {
  expect(Uint.from(evalShr(1, 8)).toBigInt()).toBe(4n);
});

test("IR shr exposes expression lowering", () => {
  const expr = shr(1, get("x"));
  expect(expr).toBeInstanceOf(Expression);
  expect(String(expr.frag.signature))
    .toBe("(Uint, Uint) → 2|Uint");
});

test("sub keeps the public lhs-rhs order over EVM stack order", () => {
  expect([...assemble(set("x", sub(32, 0)))])
    .toEqual([Op.PUSH0, Op.PUSH1, 32, Op.SUB]);
});

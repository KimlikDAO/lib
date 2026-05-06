import { expect, test } from "bun:test";
import { bind } from "../binder";
import { DUPN, Op, SWAPN } from "../opcodes";
import { Ops } from "../ops";
import {
  Addr,
  CodeAtom,
  dup,
  eat,
  Fragment,
  get,
  Locn,
  Size,
  use,
  Word,
} from "../types";

type Symbolic = number | string;

const expr = (code: Op): Fragment => new Fragment([], 0, [Word], [code]);

const sink = (arity: number): Fragment =>
  new Fragment(Array(arity).fill(Word), arity, [], []);

const countOp = (code: readonly CodeAtom[], op: Op): number => {
  let count = 0;
  for (const atom of code)
    if (atom == op) ++count;
  return count;
}

const searchCost = (code: readonly CodeAtom[]): number => {
  let cost = 0;
  for (let i = 0; i < code.length; ++i) {
    const atom = code[i];
    if (atom instanceof Uint8Array) continue;
    if (typeof atom != "number")
      throw new Error("unsupported symbolic test atom");
    if (atom == Op.PUSH0 || atom == Op.POP) cost += 2;
    else if (Op.PUSH1 <= atom && atom <= Op.PUSH32) ++i;
    else if (Op.DUP1 <= atom && atom <= Op.DUP16) cost += 3;
    else if (Op.SWAP1 <= atom && atom <= Op.SWAP16) cost += 3;
    else cost += 1;
  }
  return cost;
}

const readPushData = (data: Uint8Array): number => {
  let value = 0;
  for (const byte of data)
    value = 256 * value + byte;
  return value;
}

const runSynth = (
  code: readonly CodeAtom[],
  stack: readonly Symbolic[],
): Symbolic[] => {
  const out = [...stack];
  for (let i = 0; i < code.length; ++i) {
    const atom = code[i];
    if (atom instanceof Uint8Array)
      throw new Error("unexpected push data");
    if (typeof atom != "number")
      throw new Error("unsupported symbolic test atom");

    if (atom == Op.PUSH0) {
      out.push(0);
      continue;
    }
    if (Op.PUSH1 <= atom && atom <= Op.PUSH32) {
      const data = code[++i];
      if (!(data instanceof Uint8Array))
        throw new Error("push opcode missing immediate data");
      out.push(readPushData(data));
      continue;
    }
    if (Op.DUP1 <= atom && atom <= Op.DUP16) {
      const n = atom - Op.DUP1 + 1;
      out.push(out[out.length - n]!);
      continue;
    }
    if (Op.SWAP1 <= atom && atom <= Op.SWAP16) {
      const n = atom - Op.SWAP1 + 1;
      const top = out.length - 1;
      const other = top - n;
      [out[top], out[other]] = [out[other]!, out[top]!];
      continue;
    }
    if (atom == Op.POP) {
      out.pop();
      continue;
    }
    if (atom == Op.ADDRESS) {
      out.push("a");
      continue;
    }
    if (atom == Op.ORIGIN) {
      out.push("b");
      continue;
    }
    if (atom == Op.CALLER) {
      out.push("c");
      continue;
    }

    throw new Error(`unsupported symbolic test opcode: ${atom}`);
  }
  return out;
}

const expectStack = (
  stack: readonly Symbolic[],
  pattern: readonly (Symbolic | "*")[],
) => {
  expect(stack.length).toBe(pattern.length);
  for (let i = 0; i < pattern.length; ++i)
    if (pattern[i] != "*")
      expect(stack[i]).toBe(pattern[i]);
}

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

test("bind supports one dup among generated fragments", () => {
  const source = new Fragment([], 0, [Locn], [Op.PC]);
  const out = bind([dup(1), source, 0], Ops[Op.CODECOPY]!);

  expect(String(out.signature())).toBe("(Size) → 0|");
  expect(out.code).toEqual([
    DUPN(1),
    Op.PC,
    Op.PUSH0,
    Op.CODECOPY,
  ]);
});

test("bind supports one dup among generated arguments", () => {
  const out = bind([dup(1), 0], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Size) → 0|⊤");
  expect(out.code).toEqual([DUPN(1), Op.PUSH0, Op.RETURN]);
});

test("bind moves one dup past generated arguments", () => {
  const out = bind([0, dup(1)], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Locn) → 0|⊤");
  expect(out.code).toEqual([Op.PUSH0, DUPN(2), Op.RETURN]);
});

test("bind supports all-dup arguments through typed copies", () => {
  const out = bind([dup(1), dup(2)], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Locn, Size) → 0|⊤");
  expect(out.code).toEqual([DUPN(1), DUPN(3), Op.RETURN]);
});

test("bind fills dup-strategy Word gaps with PUSH0", () => {
  const f = new Fragment([Size, Word, Locn], 3, [], [Op.CODECOPY]);
  const out = bind([dup(1), , dup(3)], f);

  expect(String(out.signature())).toBe("(Locn, , Size) → 0|");
  expect(out.code).toEqual([DUPN(1), Op.PUSH0, DUPN(5), Op.CODECOPY]);
});

test("bind supports use arguments that consume the source stack", () => {
  const out = bind([use(1), 0], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Size) → 1|⊤");
  expect(out.code).toEqual([Op.PUSH0, Op.RETURN]);
});

test("bind uses swaps to order all-use arguments in place", () => {
  const out = bind([use(1), use(2)], Ops[Op.RETURN]!);

  expect(String(out.signature())).toBe("(Locn, Size) → 2|⊤");
  expect(out.code).toEqual([SWAPN(1), Op.RETURN]);
});

test("bind duplicates repeated use arguments during all-use search", () => {
  const out = bind([use(1), use(1)], Ops[Op.ADD]!);

  expect(String(out.signature())).toBe("(Uint) → 1|Uint");
  expect(out.code).toEqual([DUPN(1), Op.ADD]);
});

test("bind treats blanks as exact-output wildcards in all-use search", () => {
  const f = new Fragment([Word, Word, Word], 3, [], [Op.POP]);
  const out = bind([use(1), , use(3)], f);

  expect(String(out.signature())).toBe("(, , ) → 3|");
  expect(out.code).toEqual([SWAPN(2), Op.POP]);
});

test("bind synthesizes the full mixed use expression target exactly", () => {
  const out = bind([
    use(1),
    use(4),
    expr(Op.ADDRESS),
    expr(Op.ORIGIN),
    use(3),
    ,
    use(3),
    expr(Op.CALLER),
    use(6),
  ], sink(9));

  expect(String(out.signature())).toBe("(, , , , , ) → 6|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(1);
  expect(countOp(out.code, Op.ORIGIN)).toBe(1);
  expect(countOp(out.code, Op.CALLER)).toBe(1);
  expect(searchCost(out.code)).toBe(26);
  expectStack(
    runSynth(out.code, [6, 5, 4, 3, 2, 1]),
    [1, 4, "a", "b", 3, "*", 3, "c", 6],
  );
});

test("bind pops unused source values instead of preserving a prefix", () => {
  const out = bind([use(1), use(3)], sink(2));

  expect(String(out.signature())).toBe("(, , ) → 3|");
  expectStack(runSynth(out.code, [3, 2, 1]), [1, 3]);
});

test("bind reorders pure expression fragments through the same search path", () => {
  const out = bind([
    expr(Op.ORIGIN),
    expr(Op.ADDRESS),
    expr(Op.CALLER),
  ], sink(3));

  expect(String(out.signature())).toBe("() → 0|");
  expect(out.code).toEqual([Op.ORIGIN, Op.ADDRESS, Op.CALLER]);
  expectStack(runSynth(out.code, []), ["b", "a", "c"]);
});

test("bind handles repeated deep use values with interleaved expressions", () => {
  const out = bind([
    use(4),
    expr(Op.ADDRESS),
    use(2),
    use(4),
    use(1),
  ], sink(5));

  expect(String(out.signature())).toBe("(, , , ) → 4|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(1);
  expectStack(runSynth(out.code, [4, 3, 2, 1]), [4, "a", 2, 4, 1]);
});

test("bind rejects unsupported mixed stackref patterns", () => {
  expect(() => bind([get(1), use(2)], Ops[Op.RETURN]!))
    .toThrow("unsupported bind pattern");
  expect(() => bind([eat(1), 0], Ops[Op.RETURN]!))
    .toThrow("unsupported bind pattern");
});

test("bind rejects get until the in-place strategy is implemented", () => {
  expect(() => bind([get(2), get(1)], Ops[Op.RETURN]!))
    .toThrow("unsupported bind pattern");
  expect(() => bind([get(2), 0, get(1)], Ops[Op.CODECOPY]!))
    .toThrow("unsupported bind pattern");
});

test("bind checks generated fragment output type", () => {
  const addr = new Fragment([], 0, [Addr], [Op.ADDRESS]);

  expect(() => bind([addr, 0], Ops[Op.RETURN]!))
    .toThrow("bound fragment at position 1");
});

test("bind rejects conflicting type expectations for the same use", () => {
  const f = new Fragment([Size, Addr], 2, [], []);

  expect(() => bind([use(1), use(1)], f))
    .toThrow("conflicting use(1) expectation");
});

test("bind accepts nine argument bindings", () => {
  const args = Array.from({ length: 9 }, () => expr(Op.ADDRESS));
  const out = bind(args, sink(9));

  expect(String(out.signature())).toBe("() → 0|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(9);
});

test("bind optimizes a max-arity mixed stack target", () => {
  const out = bind([
    use(9),
    expr(Op.ADDRESS),
    use(1),
    ,
    use(8),
    expr(Op.ORIGIN),
    use(5),
    use(8),
    expr(Op.CALLER),
  ], sink(9));

  expect(String(out.signature())).toBe("(, , , , , , , , ) → 9|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(1);
  expect(countOp(out.code, Op.ORIGIN)).toBe(1);
  expect(countOp(out.code, Op.CALLER)).toBe(1);
  expect(searchCost(out.code)).toBeLessThanOrEqual(23);
  expectStack(
    runSynth(out.code, [9, 8, 7, 6, 5, 4, 3, 2, 1]),
    [9, "a", 1, "*", 8, "b", 5, 8, "c"],
  );
});

test("bind handles max-arity repeated deep uses away from the top", () => {
  const out = bind([
    use(2),
    use(7),
    expr(Op.ADDRESS),
    use(4),
    ,
    expr(Op.ORIGIN),
    use(1),
    use(7),
    use(9),
  ], sink(9));

  expect(String(out.signature())).toBe("(, , , , , , , , ) → 9|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(1);
  expect(countOp(out.code, Op.ORIGIN)).toBe(1);
  expect(searchCost(out.code)).toBeLessThanOrEqual(32);
  expectStack(
    runSynth(out.code, [9, 8, 7, 6, 5, 4, 3, 2, 1]),
    [2, 7, "a", 4, "*", "b", 1, 7, 9],
  );
});

test("bind handles max-arity targets with multiple blanks", () => {
  const out = bind([
    use(9),
    ,
    use(1),
    expr(Op.ADDRESS),
    use(5),
    ,
    use(8),
    expr(Op.ORIGIN),
    use(2),
  ], sink(9));

  expect(String(out.signature())).toBe("(, , , , , , , , ) → 9|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(1);
  expect(countOp(out.code, Op.ORIGIN)).toBe(1);
  expect(searchCost(out.code)).toBeLessThanOrEqual(18);
  expectStack(
    runSynth(out.code, [9, 8, 7, 6, 5, 4, 3, 2, 1]),
    [9, "*", 1, "a", 5, "*", 8, "b", 2],
  );
});

test("bind allows ten argument bindings outside the search strategy", () => {
  const args = Array.from({ length: 10 }, () => expr(Op.ADDRESS));
  const out = bind(args, sink(10));

  expect(String(out.signature())).toBe("() → 0|");
  expect(countOp(out.code, Op.ADDRESS)).toBe(10);
});

test("bind handles ten argument use bindings through append-trim", () => {
  const args = [
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    expr(Op.ADDRESS),
    use(1),
  ];
  const out = bind(args, sink(10));

  expect(out.pop).toBe(1);
  expect(countOp(out.code, Op.ADDRESS)).toBe(9);
  expectStack(runSynth(out.code, [1]), [
    "a", "a", "a", "a", "a", "a", "a", "a", "a", 1,
  ]);
});

test("bind accepts use at the maximum stack depth", () => {
  const out = bind([use(9)], sink(1));

  expect(out.pop).toBe(9);
  expect(out.expect.length).toBe(9);
  expectStack(runSynth(out.code, [9, 8, 7, 6, 5, 4, 3, 2, 1]), [9]);
});

test("bind handles use beyond the search depth through append-trim", () => {
  const out = bind([use(10)], sink(1));

  expect(out.pop).toBe(10);
  expect(out.expect.length).toBe(10);
  expectStack(runSynth(out.code, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]), [10]);
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

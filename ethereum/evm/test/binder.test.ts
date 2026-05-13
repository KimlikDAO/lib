import { expect, test } from "bun:test";
import { bind, collectNames, createProblem, fragmentFromPath } from "../binder";
import { call } from "../builtins";
import { Expression, get } from "../expression";
import { Fragment } from "../fragment";
import { DUPN, Op, SWAPN } from "../opcodes";
import { Signature } from "../signature";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP_ACTION,
} from "../solver/action";
import { Uint, Weis, Word } from "../types";

const numberOps = (code: readonly unknown[]): number[] =>
  code.filter((atom): atom is number => typeof atom == "number");

const bin = () => Fragment.from({
  expect: [Uint, Uint],
  pop: 2,
  ensure: [Uint],
});

const tri = () => Fragment.from({
  expect: [Uint, Uint, Uint],
  pop: 3,
  ensure: [Uint],
});

test("collectNames finds stack refs in an expression tree", () => {
  const expr = new Expression([get("x"), get("y")], bin());

  expect([...collectNames(expr)].sort())
    .toEqual(["x", "y"]);
});

test("createProblem builds the initial nominal stack and rules", () => {
  const g = new Expression([8, 9], bin());
  const h = new Expression([get("x"), get("y")], bin());
  const j = new Expression([10, 11], bin());
  const expr = new Expression([g, h, j], tri());
  const prefix = new Signature(
    [],
    0,
    [Uint, Uint, Uint, Uint],
    ["keep", "x", "y", "top"],
  );

  const problem = createProblem(prefix, expr, new Set(["keep"]));

  expect(problem.init).toEqual([-3, -2, -1, 0]);
  expect(problem.keep).toEqual([-3]);
  expect(problem.output).toBe(1);
  expect(problem.rules).toHaveLength(9);
  expect(problem.rules.some((inputs) =>
    inputs[0] == -2 && inputs[1] == -1
  )).toBe(true);
});

test("createProblem rejects refs outside the prefix signature", () => {
  const prefix = new Signature([], 0, [Uint], ["x"]);
  const expr = new Expression([get("missing")], Fragment.from({
    expect: [Uint],
    pop: 1,
    ensure: [Uint],
  }));

  expect(() => createProblem(prefix, expr, new Set()))
    .toThrow("unknown stack name missing");
});

test("createProblem handles call with named amount", () => {
  const recipient = "0x1111111111111111111111111111111111111111";
  const expr = call(0, recipient, get("amount"), 0, 0, 0, 0);
  const problem = createProblem(
    new Signature(
      [],
      0,
      [Weis, Uint, Uint, Uint],
      ["amount", undefined, undefined, undefined],
    ),
    expr,
    new Set(["amount"]),
  );

  expect(problem.init).toEqual([-1, 0, 0, 0]);
  expect(problem.keep).toEqual([-1]);
  expect(problem.output).toBe(1);
  expect(problem.idsByName.get("amount")).toBe(-1);
});

test("createProblem filters keep names that are outside the problem", () => {
  const unary = () => Fragment.from({
    expect: [Uint],
    pop: 1,
    ensure: [Uint],
  });
  const expr = new Expression([
    new Expression([get("a")], unary()),
  ], unary());

  const problem = createProblem(
    new Signature([], 0, [Uint, Uint], ["a", "b"]),
    expr,
    new Set(["a", "c"]),
  );

  expect(problem.init).toEqual([-1, 0]);
  expect(problem.keep).toEqual([-1]);
  expect(problem.output).toBe(1);
  expect(problem.rules).toEqual([
    [],
    [2],
    [-1],
  ]);
});

test("bind emits a DUP postorder solution when all used names are kept", () => {
  const recipient = "0x1111111111111111111111111111111111111111";
  const expr = call(0, recipient, get("amount"), 0, 0, 0, 0);
  const out = bind(
    new Signature(
      [],
      0,
      [Weis, Uint, Uint, Uint],
      ["amount", undefined, undefined, undefined],
    ),
    expr,
    new Set(["amount"]),
  );

  expect(String(out.signature)).toBe("(Weis, , , ) → 0|Bool");
  expect(numberOps(out.code)).toEqual([
    Op.PUSH0,
    Op.PUSH0,
    Op.PUSH0,
    Op.PUSH0,
    DUPN(8),
    Op.PUSH20,
    Op.PUSH0,
    Op.CALL,
  ]);
});

test("bind uses the direct solver when kept ids cover all participating ids", () => {
  const expr = new Expression([get("amount")], Fragment.from({
    expect: [Weis],
    pop: 1,
    ensure: [Weis],
  }));
  const out = bind(
    new Signature([], 0, [Weis, Uint], ["amount", "other"]),
    expr,
    new Set(["amount", "other"]),
  );

  expect(numberOps(out.code)).toEqual([DUPN(2)]);
});

test("bind uses the direct solver for closed expressions", () => {
  const out = bind(
    new Signature([], 0, []),
    Expression.fromLiteral(0, Uint),
    new Set(),
  );

  expect(numberOps(out.code)).toEqual([Op.PUSH0]);
});

test("fragmentFromPath emits code from path action ids", () => {
  const expr = Expression.fromLiteral(0, Uint);
  const problem = createProblem(new Signature([], 0, []), expr, new Set());
  const path = {
    beg: problem.init,
    actions: [problem.output],
    end: [problem.output],
  };

  const out = fragmentFromPath(problem, path);

  expect(String(out.signature)).toBe("() → 0|Uint");
  expect(numberOps(out.code)).toEqual([Op.PUSH0]);
});

test("fragmentFromPath restores names only for kept ids", () => {
  const problem = createProblem(
    new Signature([], 0, [Weis], ["amount"]),
    Expression.fromLiteral(0, Uint),
    new Set(["amount"]),
  );
  const path = {
    beg: problem.init,
    actions: [],
    end: [problem.keep[0]!, problem.output],
  };

  const out = fragmentFromPath(problem, path);

  expect(String(out.signature)).toBe("(Weis) → 0|Uint");
  expect(out.code).toEqual([]);
});

test("fragmentFromPath emits primitive stack actions", () => {
  const problem = createProblem(
    new Signature([], 0, [Uint, Uint], ["x", "y"]),
    Expression.fromLiteral(0, Uint),
    new Set(["x", "y"]),
  );
  const path = {
    beg: [-2, -1],
    actions: [DUP_ACTION(1), SWAP_ACTION(1), POP_ACTION],
    end: [-2, -1],
  };

  const out = fragmentFromPath(problem, path);

  expect(out.signature.pop).toBe(1);
  expect(numberOps(out.code)).toEqual([DUPN(1), Op.SWAP1, Op.POP]);
});

test("fragmentFromPath emits blank shape action", () => {
  const problem = createProblem(
    new Signature([], 0, []),
    Expression.fromLiteral(1, Uint),
    new Set(),
  );
  const path = {
    beg: [],
    actions: [BLANK_ACTION],
    end: [0],
  };

  const out = fragmentFromPath(problem, path);

  expect(out.signature.pop).toBe(0);
  expect(out.signature.ensure).toEqual([Word]);
  expect(numberOps(out.code)).toEqual([Op.PUSH0]);
});

test("fragmentFromPath keeps pop at zero when a path grows the stack", () => {
  const problem = createProblem(
    new Signature([], 0, [Uint, Uint], ["x", "y"]),
    Expression.fromLiteral(1, Uint),
    new Set(["x", "y"]),
  );
  const path = {
    beg: [-2, -1],
    actions: [BLANK_ACTION, problem.output],
    end: [-2, -1, 0, problem.output],
  };

  const out = fragmentFromPath(problem, path);

  expect(String(out.signature)).toBe("(Uint, Uint) → 0|, Uint");
  expect(numberOps(out.code)).toEqual([Op.PUSH0, Op.PUSH1]);
});

test("bind pops trailing junk to bring kept values into DUP16 range", () => {
  const expr = new Expression([get("amount")], Fragment.from({
    expect: [Weis],
    pop: 1,
    ensure: [Weis],
  }));
  const out = bind(
    new Signature(
      [],
      0,
      [Weis, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint,
        Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint],
      ["amount", undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined],
    ),
    expr,
    new Set(["amount"]),
  );

  expect(numberOps(out.code)).toEqual([
    Op.POP,
    Op.POP,
    Op.POP,
    Op.POP,
    DUPN(16),
  ]);
});

test("bind accounts for emitted values before a deep DUP", () => {
  const recipient = "0x1111111111111111111111111111111111111111";
  const out = bind(
    new Signature(
      [],
      0,
      [Weis, ...Array(14).fill(Uint)],
      ["amount", ...Array(14).fill(undefined)],
    ),
    call(0, recipient, get("amount"), 0, 0, 0, 0),
    new Set(["amount"]),
  );

  expect(out.signature.pop).toBe(3);
  expect(numberOps(out.code)).toEqual([
    Op.POP,
    Op.POP,
    Op.POP,
    Op.PUSH0,
    Op.PUSH0,
    Op.PUSH0,
    Op.PUSH0,
    DUPN(16),
    Op.PUSH20,
    Op.PUSH0,
    Op.CALL,
  ]);
});

test("bind uses A* when direct DUP postorder cannot expose deep refs", () => {
  const expr = new Expression([get("amount"), get("top")], bin());
  const prefix = new Signature(
    [],
    0,
    [Weis, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint,
      Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint, Uint],
    ["amount", undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, "top"],
  );

  const out = bind(prefix, expr, new Set(["amount", "top"]));

  expect(out.signature.pop).toBe(4);
  expect(numberOps(out.code)).toEqual([
    SWAPN(4),
    Op.POP,
    Op.POP,
    Op.POP,
    Op.POP,
    DUPN(16),
    DUPN(2),
  ]);
});

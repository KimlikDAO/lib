import { expect, test } from "bun:test";
import { bind, collectNames, fragmentFromPath, prepareSearch } from "../binder";
import { call } from "../builtins";
import { Expression, get } from "../expression";
import { Fragment } from "../fragment";
import { DUPN, Op } from "../opcodes";
import { Signature } from "../signature";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  Path,
  SWAP_ACTION,
} from "../solver/types";
import { Weis, Uint, Word } from "../types";

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

test("prepareSearch builds the initial nominal stack and goal predicate", () => {
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

  const setup = prepareSearch(prefix, expr, new Set(["keep"]));

  expect(setup.initial.stack).toEqual([-3, -2, -1, 0]);
  expect(setup.keep).toEqual([-3]);
  expect(setup.output).toBe(1);
  expect(setup.initial.actions).toHaveLength(8);
  expect([...setup.actionsById.values()].some((action) =>
    action.inputs[0] == -2 && action.inputs[1] == -1
  )).toBe(true);

  expect(setup.goal({ stack: [-3, 1], actions: [] })).toBe(true);
  expect(setup.goal({ stack: [1], actions: [] })).toBe(false);
  expect(setup.goal({ stack: [-3, 2], actions: [] })).toBe(false);
  expect(setup.goal({
    stack: [-3, 1],
    actions: setup.initial.actions,
  })).toBe(false);
});

test("prepareSearch rejects refs outside the prefix signature", () => {
  const prefix = new Signature([], 0, [Uint], ["x"]);
  const expr = new Expression([get("missing")], Fragment.from({
    expect: [Uint],
    pop: 1,
    ensure: [Uint],
  }));

  expect(() => prepareSearch(prefix, expr, new Set()))
    .toThrow("unknown stack name missing");
});

test("logs prepareSearch for call with named amount", () => {
  const recipient = "0x1111111111111111111111111111111111111111";
  const expr = call(0, recipient, get("amount"), 0, 0, 0, 0);
  const setup = prepareSearch(
    new Signature(
      [],
      0,
      [Weis, Uint, Uint, Uint],
      ["amount", undefined, undefined, undefined],
    ),
    expr,
    new Set(["amount"]),
  );

  console.log("prepareSearch(call(...))", JSON.stringify({
    initial: {
      stack: setup.initial.stack,
      actions: setup.initial.actions.map((id) => {
        const { inputs, output } = setup.actionsById.get(id)!;
        const frag = setup.fragsByActionId.get(id)!;
        return {
          id,
          inputs,
          output,
          signature: String(frag.signature),
        };
      }),
    },
    keep: setup.keep,
    output: setup.output,
    idsByName: Object.fromEntries(setup.idsByName),
    acceptsExampleGoal: setup.goal({
      stack: [setup.keep[0]!, setup.output],
      actions: [],
    }),
  }, null, 2));

  expect(setup.initial.stack).toEqual([-1, 0, 0, 0]);
  expect(setup.keep).toEqual([-1]);
  expect(setup.output).toBe(1);
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
  const setup = prepareSearch(new Signature([], 0, []), expr, new Set());
  const path = new Path(setup.initial, setup.initial.actions, {
    stack: [setup.output],
    actions: [],
  });

  const out = fragmentFromPath(setup, path);

  expect(String(out.signature)).toBe("() → 0|Uint");
  expect(numberOps(out.code)).toEqual([Op.PUSH0]);
});

test("fragmentFromPath restores names only for kept ids", () => {
  const setup = prepareSearch(
    new Signature([], 0, [Weis], ["amount"]),
    Expression.fromLiteral(0, Uint),
    new Set(["amount"]),
  );
  const path = new Path(setup.initial, [], {
    stack: [setup.keep[0]!, setup.output],
    actions: [],
  });

  const out = fragmentFromPath(setup, path);

  expect(String(out.signature)).toBe("(Weis) → 0|Uint");
  expect(out.code).toEqual([]);
});

test("fragmentFromPath emits primitive stack actions", () => {
  const setup = prepareSearch(
    new Signature([], 0, [Uint, Uint], ["x", "y"]),
    Expression.fromLiteral(0, Uint),
    new Set(["x", "y"]),
  );
  const path = new Path(
    { stack: [-2, -1], actions: [] },
    [DUP_ACTION(1), SWAP_ACTION(1), POP_ACTION],
    { stack: [-2, -1], actions: [] },
  );

  const out = fragmentFromPath(setup, path);

  expect(out.signature.pop).toBe(0);
  expect(numberOps(out.code)).toEqual([DUPN(1), Op.SWAP1, Op.POP]);
});

test("fragmentFromPath emits blank shape action", () => {
  const setup = prepareSearch(
    new Signature([], 0, []),
    Expression.fromLiteral(1, Uint),
    new Set(),
  );
  const path = new Path(
    { stack: [], actions: [] },
    [BLANK_ACTION],
    { stack: [0], actions: [] },
  );

  const out = fragmentFromPath(setup, path);

  expect(out.signature.pop).toBe(0);
  expect(out.signature.ensure).toEqual([Word]);
  expect(numberOps(out.code)).toEqual([Op.PUSH0]);
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

test("bind rejects direct DUP postorder when top junk cannot expose deep refs", () => {
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

  expect(() => bind(prefix, expr, new Set(["amount", "top"])))
    .toThrow("cannot bring deepest stack value into DUP16");
});

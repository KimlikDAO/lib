import { expect, test } from "bun:test";
import { collectNames, prepareSearch } from "../binder";
import { Expression, get } from "../expression";
import { Fragment } from "../fragment";
import { Signature } from "../signature";
import { set } from "../statement";
import { Uint } from "../types";

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

test("collectNames finds stack refs without reading set bindings", () => {
  const init = new Expression([get("x"), get("y")], bin());

  expect([...collectNames(set({ x: "z" }, init))].sort())
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

  expect(setup.initial.stack).toEqual([4, 3, 2, 1]);
  expect(setup.keep).toEqual([4]);
  expect(setup.outputs).toEqual([-1]);
  expect(setup.initial.actions).toHaveLength(8);
  expect(setup.initial.actions.some((action) =>
    action.inputs[0] == 3 && action.inputs[1] == 2
  )).toBe(true);

  expect(setup.goal({ stack: [4, -1], actions: [] })).toBe(true);
  expect(setup.goal({ stack: [-1], actions: [] })).toBe(false);
  expect(setup.goal({ stack: [4, -2], actions: [] })).toBe(false);
  expect(setup.goal({
    stack: [4, -1],
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

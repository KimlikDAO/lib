import { expect, test } from "bun:test";
import { starDistance } from "../distance";
import { Problem, RuleInputs, StackState, ValueId } from "../solver.d";
import { SearchNodeView } from "../state";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): Problem => ({ init, keep, output, rules });

const wideProblem = () => problem([], [], 1, [[], [7, 6, 5, 4, 3, 2]]);

const score = (
  problem: Problem,
  stack: number[],
): number => SearchNodeView.from(problem).hScore(stack);

test("starDistance projects available children onto suffix homes", () => {
  expect(starDistance(
    [4, 5, 6, 7, 8],
    [4, 5, 6, 0, 0, 0, 0],
  )).toBe(5);
});

test("SearchNodeView.from scores the initial node", () => {
  const state = SearchNodeView.from(wideProblem());

  expect(state.node.h).toBe(state.hScore());
  expect(state.node.h).toBeGreaterThan(0);
});

test("hScore prices star swaps, missing children, and white rule nodes", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5, 6, 7, 8], [9, 10, 11, 12, 13]]
  );

  expect(score(p, [4, 5, 6, 0, 0, 0, 0])).toBe(30);
  expect(score(p, [9, 10, 11, 0, 0, 0, 0])).toBe(30);

  const q = problem(
    [],
    [],
    1,
    [[], [2, 3, 4, 5, 6]]
  );

  expect(score(q, [2, 3, 4, 0, 0, 0, 0])).toBe(24);
});

test("hScore rewards the first ordered child over later children", () => {
  const problem = wideProblem();

  expect(score(problem, [7])).toBeLessThan(score(problem, [6]));
  expect(score(problem, [7])).toBeLessThan(score(problem, [5]));
  expect(score(problem, [7])).toBeLessThan(score(problem, [4]));
});

test("hScore rewards ordered prefix progress", () => {
  const problem = wideProblem();

  expect(score(problem, [7, 6])).toBeLessThan(score(problem, [7]));
  expect(score(problem, [7, 6])).toBeLessThan(score(problem, [7, 5]));
  expect(score(problem, [7])).toBe(score(problem, [7, 5]));
});

test("hScore preserves prefix signal through trailing holes", () => {
  const problem = wideProblem();

  expect(score(problem, [7, 0])).toBe(score(problem, [7, 0, 0]));
  expect(score(problem, [7, 0])).toBeLessThan(score(problem, [6, 0]));
});

test("hScore returns zero when the output is already on stack", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [7, 6], [5, 4]],
  );

  expect(score(p, [1])).toBe(0);
});

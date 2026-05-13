import { expect, test } from "bun:test";
import { starDistance } from "../distance";
import { Problem as SearchProblem } from "../problem";
import { ProblemData, RuleInputs, StackState, ValueId } from "../solver.d";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): ProblemData => ({ init, keep, output, rules });

const wideProblem = () => problem([], [], 1, [[], [7, 6, 5, 4, 3, 2]]);

const score = (
  problem: ProblemData,
  stack: number[],
): number => SearchProblem.fromProblemData(problem).problem.hScore(stack);

test("starDistance projects available children onto suffix homes", () => {
  expect(starDistance(
    [4, 5, 6, 7, 8],
    [4, 5, 6, 0, 0, 0, 0],
  )).toBe(5);
});

test("Problem.fromProblemData scores the initial node", () => {
  const { problem, start } = SearchProblem.fromProblemData(wideProblem());

  expect(start.h).toBe(problem.hScore(start.stack));
  expect(start.h).toBeGreaterThan(0);
});

test("hScore prices star swaps and white action nodes", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5, 6, 7, 8], [9, 10, 11, 12, 13]]
  );

  expect(score(p, [4, 5, 6, 0, 0, 0, 0])).toBe(37.5);
  expect(score(p, [9, 10, 11, 0, 0, 0, 0])).toBe(37.5);

  const q = problem(
    [],
    [],
    1,
    [[], [2, 3, 4, 5, 6]]
  );

  expect(score(q, [2, 3, 4, 0, 0, 0, 0])).toBe(16.5);
});

test("hScore prices copied stack refs into a rule suffix", () => {
  const p = problem(
    [-2, 0, -1, 0, 0],
    [],
    1,
    [[], [2, 3, 4, -2, 5, -1]],
  );

  expect(score(p, [...p.init])).toBe(21);
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
  expect(score(problem, [7, 5])).toBeLessThan(score(problem, [7]));
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

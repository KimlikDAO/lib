import { expect, test } from "bun:test";
import {
  BLANK_ACTION,
  DUP16_ACTION,
  DUP1_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP16_ACTION,
  SWAP1_ACTION,
  SWAP_ACTION,
  dupIndex,
  swapIndex,
} from "../action";
import { Problem as SearchProblem } from "../problem";
import { ProblemData, RuleInputs, StackState, ValueId } from "../solver.d";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): ProblemData => ({ init, keep, output, rules });

test("Solution stores start, action ids, and end stack", () => {
  const solution = {
    beg: [2, 1],
    actions: [-1],
    end: [2, -1],
  };

  expect(solution.beg).toEqual([2, 1]);
  expect(solution.actions).toEqual([-1]);
  expect(solution.end).toEqual([2, -1]);
});

test("Problem validates ProblemData and counts stack vars", () => {
  const p = problem(
    [-3, -2, -1, 0, 0],
    [-1, -3, -2],
    1,
    [[], [-1]],
  );
  const { problem: searchProblem } = SearchProblem.fromProblemData(p);

  expect(searchProblem.keep).toEqual([-3, -2, -1]);
  expect(searchProblem.stackVars).toBe(3);
});

test("primitive action ids are fixed", () => {
  expect(BLANK_ACTION).toBe(0);
  expect(POP_ACTION).toBe(-1);
  expect(SWAP1_ACTION).toBe(-2);
  expect(SWAP16_ACTION).toBe(-17);
  expect(DUP1_ACTION).toBe(-18);
  expect(DUP16_ACTION).toBe(-33);
  expect(SWAP_ACTION(1)).toBe(-2);
  expect(SWAP_ACTION(16)).toBe(-17);
  expect(DUP_ACTION(1)).toBe(-18);
  expect(DUP_ACTION(16)).toBe(-33);
  expect(swapIndex(-3)).toBe(2);
  expect(swapIndex(1)).toBe(0);
  expect(swapIndex(-18)).toBe(0);
  expect(dupIndex(-33)).toBe(16);
  expect(dupIndex(1)).toBe(0);
  expect(dupIndex(-17)).toBe(0);
});

test("forEachNode visits the rule tree in postorder", () => {
  const p = problem(
    [-2, -1],
    [-2, -1],
    1,
    [[], [2, -1], [-2, BLANK_ACTION]],
  );
  const seen: [number, number][] = [];

  SearchProblem.fromProblemData(p).problem.forEachNode(
    (actionId, pos) => seen.push([actionId, pos])
  );

  expect(seen).toEqual([
    [-2, 0],
    [BLANK_ACTION, 1],
    [2, 2],
    [-1, 1],
    [1, 2],
  ]);
});

test("forEachWhiteNode stops at stack values", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5], [6]],
  );
  const white: number[] = [];

  SearchProblem.fromProblemData(p).problem.forEachWhiteNode(
    [2],
    (value) => white.push(value),
  );

  expect(white).toEqual([6, 3, 1]);
});

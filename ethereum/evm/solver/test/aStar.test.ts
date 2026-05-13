import { expect, test } from "bun:test";
import { hashArray } from "../../util/arrays";
import { solveAStar } from "../aStar";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP_ACTION,
  gas,
} from "../action";
import { GraphNode } from "../graph";
import { Problem as SearchProblem } from "../problem";
import { ProblemData, RuleInputs, StackState, ValueId } from "../solver.d";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): ProblemData => ({ init, keep, output, rules });

const wideProblem = () => problem([], [], 1, [[], [7, 6, 5, 4, 3, 2]]);

const stepState = (
  problemData: ProblemData,
  state: readonly number[],
  action: number,
): number[] | null => {
  const { problem } = SearchProblem.fromProblemData(problemData);
  const node = new GraphNode(
    [...state],
    BLANK_ACTION,
    null,
    0,
    problem.hScore([...state]),
  );
  try {
    return [...problem.applyAction(node, action).stack];
  } catch {
    return null;
  }
}

const runActions = (
  problem: ProblemData,
  state: readonly number[],
  actions: readonly number[],
): number[] => {
  let current = [...state];
  for (const action of actions) {
    const next = stepState(problem, current, action);
    expect(next).not.toBeNull();
    current = next!;
  }
  return current;
}

const pathGas = (actions: readonly number[]): number =>
  actions.reduce((sum, action) => sum + gas(action), 0);

test("hashArray returns a stable numeric key for stack states", () => {
  const states = [
    [],
    [0],
    [0, 0],
    [1, 2, 3],
    [1, 3, 2],
    [-1, 0, 1],
    [1, 0, -1],
  ];
  const hashes = states.map(hashArray);

  expect(hashArray([1, 2, 3])).toBe(hashArray([1, 2, 3]));
  for (const hash of hashes)
    expect(Number.isSafeInteger(hash)).toBe(true);
  expect(new Set(hashes).size).toBe(states.length);
});

test("Problem.applyAction applies primitive stack actions", () => {
  const problem = wideProblem();

  expect(stepState(problem, [1, 2], BLANK_ACTION)).toEqual([1, 2, 0]);
  expect(stepState(problem, [1, 2], POP_ACTION)).toEqual([1]);
  expect(stepState(problem, [], POP_ACTION)).toBeNull();
  expect(stepState(problem, [1, 2], DUP_ACTION(2))).toEqual([1, 2, 1]);
  expect(stepState(problem, [1], DUP_ACTION(2))).toBeNull();
  expect(stepState(problem, [1, 2, 3], SWAP_ACTION(2)))
    .toEqual([3, 2, 1]);
  expect(stepState(problem, [1], SWAP_ACTION(1))).toBeNull();
});

test("Problem.applyAction pushes terminals and applies matching rules", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5]],
  );

  expect(stepState(p, [9], 4)).toEqual([9, 4]);
  expect(stepState(p, [4, 5], 2)).toEqual([2]);
  expect(stepState(p, [0, 4, 5], 2)).toEqual([0, 2]);
  expect(stepState(p, [5, 4], 2)).toBeNull();
  expect(stepState(p, [2, 3], 1)).toEqual([1]);
  expect(stepState(p, [-999], -999)).toBeNull();

  const zeros = problem([], [], 1, [[], [2, 3]]);
  expect(stepState(zeros, [3, 2, 2, 2, 2, 2, 2, 2, 3], 1))
    .toEqual([0, 0, 0, 0, 0, 0, 0, 1]);

  const futureNeed = problem([-1], [], 1, [[], [2, -1], [-1]]);
  expect(stepState(futureNeed, [-1, -1], 2)).toEqual([-1, 2]);

  const kept = problem([-1], [-1], 1, [[], [-1]]);
  expect(stepState(kept, [-1, -1], 1)).toEqual([-1, 1]);
});

test("solveAStar solves a terminal expression tree", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5]],
  );
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end).toEqual([1]);
});

test("solveAStar applies a rule using a stack ref at TOS", () => {
  const p = problem([-1], [], 1, [[], [-1]]);
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end).toEqual([1]);
});

test("solveAStar accepts output above unkept stack refs", () => {
  const p = problem([-1], [], 1, [[], [2]]);
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(path.actions).toEqual([2, 1]);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end).toEqual([-1, 1]);
});

test("solveAStar solves a wide rule with a stack ref and holes", () => {
  const p = problem(
    [-1, 0, 0],
    [],
    1,
    [[], [2, 3, 4, -1, 5, 6]],
  );
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(pathGas(path.actions)).toBe(21);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(1);
});

test("solveAStar solves a wide rule with a deep stack ref after holes", () => {
  const p = problem(
    [-1, 0, 0, 0, 0, 0],
    [],
    1,
    [[], [2, 3, 4, 5, 6, -1]],
  );
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(pathGas(path.actions)).toBe(21);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(1);
});

test("solveAStar duplicates a repeated stack ref for an intermediate rule", () => {
  const p = problem(
    [-2, 0, -1, 0, 0],
    [],
    1,
    [[], [2, -2], [-1, -1]],
  );
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(path.actions.some((action) => action == DUP_ACTION(1))).toBe(true);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(1);
});

test("solveAStar assembles sibling rules with duplicated stack refs", () => {
  const p = problem(
    [-3, -2, -1, 0],
    [],
    1,
    [
      [],
      [2, 3],
      [4, 5, -1, -1],
      [6, 7, -2, -2],
    ],
  );
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(path.actions).toEqual([
    4,
    5,
    DUP_ACTION(4),
    DUP_ACTION(1),
    2,
    6,
    7,
    DUP_ACTION(6),
    DUP_ACTION(1),
    3,
    1,
  ]);
  expect(pathGas(path.actions)).toBe(33);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(1);
});

test("solveAStar solves a wide rule with multiple stack refs and holes", () => {
  const p = problem(
    [-2, 0, -1, 0, 0],
    [],
    1,
    [[], [2, 3, 4, -2, 5, -1]],
  );
  const { problem: searchProblem, start } = SearchProblem.fromProblemData(p);
  const path = solveAStar(searchProblem, start)!;

  expect(path.beg).toEqual(p.init);
  expect(pathGas(path.actions)).toBe(21);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(1);
});

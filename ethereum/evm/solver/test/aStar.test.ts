import { expect, test } from "bun:test";
import { solveAStar } from "../aStar";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP_ACTION,
} from "../action";
import { hashArray } from "../../util/arrays";
import { Problem, RuleInputs, StackState, ValueId } from "../solver.d";
import { SearchNode, SearchNodeView } from "../state";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): Problem => ({ init, keep, output, rules });

const wideProblem = () => problem([], [], 1, [[], [7, 6, 5, 4, 3, 2]]);

const whiteLeafActions = (
  problem: Problem,
  stack: readonly ValueId[],
): number[] => SearchNodeView.from(problem).whiteLeafActions([...stack]);

const stepState = (
  problem: Problem,
  state: readonly number[],
  action: number,
): number[] | null => {
  const view = SearchNodeView.from(problem);
  const next = SearchNodeView.ofNode(
    new SearchNode([...state], BLANK_ACTION, null, 0, 0),
    view,
  ).getNeighbor(action);
  return next ? [...next.stack] : null;
}

const runActions = (
  problem: Problem,
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

test("SearchNodeView.getNeighbor applies primitive stack actions", () => {
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

test("SearchNodeView.getNeighbor pushes terminals and applies matching rules", () => {
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
});

test("solveAStar solves a terminal expression tree", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5]],
  );
  const path = solveAStar(SearchNodeView.from(p))!;

  expect(path.beg).toEqual(p.init);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end).toEqual([1]);
});

test("solveAStar applies a rule using a stack ref at TOS", () => {
  const p = problem([-1], [], 1, [[], [-1]]);
  const path = solveAStar(SearchNodeView.from(p))!;

  expect(path.beg).toEqual(p.init);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end).toEqual([1]);
});

test("solveAStar accepts output above unkept stack refs", () => {
  const p = problem([-1], [], 1, [[], [2]]);
  const path = solveAStar(SearchNodeView.from(p))!;

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
  const path = solveAStar(SearchNodeView.from(p))!;

  expect(path.beg).toEqual(p.init);
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
  const path = solveAStar(SearchNodeView.from(p))!;

  expect(path.beg).toEqual(p.init);
  expect(runActions(p, path.beg, path.actions)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(1);
});

test("whiteLeafActions returns the white leaf frontier", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [2, 3], [4, 5, 6, 7, 8], [9, 10, 11, 12, 13]]
  );

  expect(whiteLeafActions(p, [4, 5, 6, 0, 0, 0, 0, 0]))
    .toEqual([7, 8, 9, 10, 11, 12, 13]);
  expect(whiteLeafActions(p, [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]))
    .toEqual([2, 3]);
  expect(whiteLeafActions(p, [2])).toEqual([9, 10, 11, 12, 13]);
  expect(whiteLeafActions(p, [2, 9, 10, 11, 12, 13])).toEqual([3]);
  expect(whiteLeafActions(p, [2, 3])).toEqual([1]);
  expect(whiteLeafActions(p, [1])).toEqual([]);
});

test("whiteLeafActions requires stack refs but allows zero children", () => {
  const needsStack = problem([-1], [], 1, [[], [-1]]);
  const needsZero = problem([], [], 1, [[], [0]]);

  expect(whiteLeafActions(needsStack, [])).toEqual([]);
  expect(whiteLeafActions(needsStack, [-1])).toEqual([1]);
  expect(whiteLeafActions(needsZero, [])).toEqual([1]);
});

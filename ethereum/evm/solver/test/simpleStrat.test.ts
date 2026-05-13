import { expect, test } from "bun:test";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  dupIndex,
  swapIndex,
} from "../action";
import {
  ProblemData,
  RuleInputs,
  Solution,
  StackState,
  ValueId,
} from "../solver.d";
import { GraphNode } from "../graph";
import { Problem as SearchProblem } from "../problem";
import { trySolveAllKept } from "../simpleStrat";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): ProblemData => ({ init, keep, output, rules });

const applyPath = (problem: ProblemData, path: Solution): number[] => {
  const stack = [...path.beg];
  for (const action of path.actions) {
    if (action == POP_ACTION) {
      stack.pop();
      continue;
    }

    const dup = dupIndex(action);
    if (dup) {
      expect(stack.length).toBeGreaterThanOrEqual(dup);
      stack.push(stack[stack.length - dup]!);
      continue;
    }

    const swap = swapIndex(action);
    if (swap) {
      expect(stack.length).toBeGreaterThan(swap);
      const top = stack.length - 1;
      const other = top - swap;
      [stack[top], stack[other]] = [stack[other]!, stack[top]!];
      continue;
    }

    if (action == BLANK_ACTION) {
      stack.push(0);
      continue;
    }

    const inputs = problem.rules[action];
    if (!inputs) {
      stack.push(action);
      continue;
    }

    expect(stack.slice(stack.length - inputs.length)).toEqual(inputs);
    stack.length -= inputs.length;
    stack.push(action);
  }
  return stack;
}

const expectPathSolves = (problem: ProblemData, path: Solution) => {
  expect(path.beg).toEqual(problem.init);
  expect(applyPath(problem, path)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(problem.output);
  for (const kept of problem.keep)
    expect(path.end).toContain(kept);
}

const live = (problem: ProblemData): {
  searchProblem: SearchProblem;
  startNode: GraphNode;
} => {
  const { problem: searchProblem, start } =
    SearchProblem.fromProblemData(problem);
  return { searchProblem, startNode: start };
}

test("trySolveAllKept emits a postorder DUP path", () => {
  const p = problem(
    [-2, -1],
    [-2, -1],
    1,
    [[], [-2, -1]],
  );

  const { searchProblem, startNode } = live(p);
  const path = trySolveAllKept(searchProblem, startNode)!;

  expectPathSolves(p, path);
  expect(path).toEqual({
    beg: [-2, -1],
    actions: [DUP_ACTION(2), DUP_ACTION(2), 1],
    end: [-2, -1, 1],
  });
});

test(
  "trySolveAllKept counts pending sibling outputs on the ancestor path",
  () => {
    const p = problem(
      [-2, -1],
      [-2, -1],
      1,
      [[], [2, -1]],
    );

    const { searchProblem, startNode } = live(p);
    const path = trySolveAllKept(searchProblem, startNode)!;

    expectPathSolves(p, path);
    expect(path.actions).toEqual([
      2,
      DUP_ACTION(2),
      1,
    ]);
  });

test(
  "trySolveAllKept treats missing positive rules as terminal actions",
  () => {
    const p = problem(
      [],
      [],
      1,
      [[], [2, 3]],
    );

    const { searchProblem, startNode } = live(p);
    const path = trySolveAllKept(searchProblem, startNode)!;

    expectPathSolves(p, path);
    expect(path.actions).toEqual([2, 3, 1]);
    expect(path.end).toEqual([1]);
  });

test("trySolveAllKept follows the rule child order", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [3, 2], [4, 5], [6, 7]],
  );

  const { searchProblem, startNode } = live(p);
  const path = trySolveAllKept(searchProblem, startNode)!;

  expectPathSolves(p, path);
  expect(path.actions).toEqual([6, 7, 3, 4, 5, 2, 1]);
});

test("trySolveAllKept emits repeated positive leaves directly", () => {
  const p = problem(
    [],
    [],
    1,
    [[], [4, 4]],
  );

  const { searchProblem, startNode } = live(p);
  const path = trySolveAllKept(searchProblem, startNode)!;

  expectPathSolves(p, path);
  expect(path.actions).toEqual([4, 4, 1]);
  expect(path.actions.some(dupIndex)).toBe(false);
});

test("trySolveAllKept only emits DUP for negative leaves", () => {
  const p = problem(
    [-1],
    [-1],
    1,
    [[], [2, -1, 3], [4], [5]],
  );

  const { searchProblem, startNode } = live(p);
  const path = trySolveAllKept(searchProblem, startNode)!;

  expectPathSolves(p, path);
  expect(path.actions).toEqual([4, 2, DUP_ACTION(2), 5, 3, 1]);
});

test("trySolveAllKept pops trailing zeros to bring DUP depth under 16", () => {
  const init = [-1, ...Array(16).fill(0)];
  const p = problem(init, [-1], 1, [[], [-1]]);

  const { searchProblem, startNode } = live(p);
  const path = trySolveAllKept(searchProblem, startNode)!;

  expectPathSolves(p, path);
  expect(path.actions).toEqual([POP_ACTION, DUP_ACTION(16), 1]);
  expect(path.end).toEqual([-1, ...Array(15).fill(0), 1]);
});

test("trySolveAllKept does not add pending to previous max depth", () => {
  const init = [-1, ...Array(15).fill(0)];
  const p = problem(init, [-1], 1, [[], [-1, 2]]);

  const { searchProblem, startNode } = live(p);
  const path = trySolveAllKept(searchProblem, startNode)!;

  expectPathSolves(p, path);
  expect(path.actions).toEqual([DUP_ACTION(16), 2, 1]);
});

test(
  "trySolveAllKept fails when a kept stack ref blocks required zero pops",
  () => {
    const p = problem(
      [-2, ...Array(16).fill(0), -1],
      [-2, -1],
      1,
      [[], [-2]],
    );

    const { searchProblem, startNode } = live(p);
    expect(trySolveAllKept(searchProblem, startNode)).toBeNull();
  });

test("trySolveAllKept only handles all-kept stack vars", () => {
  const p = problem([-2, -1], [-1], 1, [[], [-1]]);

  const { searchProblem, startNode } = live(p);
  expect(trySolveAllKept(searchProblem, startNode)).toBeNull();
});

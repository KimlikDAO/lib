import { expect, test } from "bun:test";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  dupIndex,
  swapIndex,
} from "../action";
import {
  Problem,
  RuleInputs,
  Solution,
  StackState,
  ValueId,
} from "../solver.d";
import { SearchNodeView } from "../state";
import { trySolveAllKept } from "../simpleStrat";

const problem = (
  init: StackState,
  keep: ValueId[],
  output: ValueId,
  rules: RuleInputs[],
): Problem => ({ init, keep, output, rules });

const applyPath = (problem: Problem, path: Solution): number[] => {
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

const expectPathSolves = (problem: Problem, path: Solution) => {
  expect(path.beg).toEqual(problem.init);
  expect(applyPath(problem, path)).toEqual(path.end);
  expect(path.end[path.end.length - 1]).toBe(problem.output);
  for (const kept of problem.keep)
    expect(path.end).toContain(kept);
}

const live = (problem: Problem): SearchNodeView => SearchNodeView.from(problem);

test("trySolveAllKept emits a postorder DUP path", () => {
  const p = problem(
    [-2, -1],
    [-2, -1],
    1,
    [[], [-2, -1]],
  );

  const path = trySolveAllKept(live(p))!;

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

    const path = trySolveAllKept(live(p))!;

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

    const path = trySolveAllKept(live(p))!;

    expectPathSolves(p, path);
    expect(path.actions).toEqual([2, 3, 1]);
    expect(path.end).toEqual([1]);
  });

test("trySolveAllKept pops trailing zeros to bring DUP depth under 16", () => {
  const init = [-1, ...Array(16).fill(0)];
  const p = problem(init, [-1], 1, [[], [-1]]);

  const path = trySolveAllKept(live(p))!;

  expectPathSolves(p, path);
  expect(path.actions).toEqual([POP_ACTION, DUP_ACTION(16), 1]);
  expect(path.end).toEqual([-1, ...Array(15).fill(0), 1]);
});

test("trySolveAllKept does not add pending to previous max depth", () => {
  const init = [-1, ...Array(15).fill(0)];
  const p = problem(init, [-1], 1, [[], [-1, 2]]);

  const path = trySolveAllKept(live(p))!;

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

    expect(trySolveAllKept(live(p))).toBeNull();
  });

test("trySolveAllKept only handles all-kept stack vars", () => {
  const p = problem([-2, -1], [-1], 1, [[], [-1]]);

  expect(trySolveAllKept(live(p))).toBeNull();
});

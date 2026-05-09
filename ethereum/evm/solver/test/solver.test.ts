import { expect, test } from "bun:test";
import {
  BLANK_ACTION,
  DUP_ACTION,
  DUP1_ACTION,
  DUP16_ACTION,
  POP_ACTION,
  SWAP_ACTION,
  SWAP1_ACTION,
  SWAP16_ACTION,
  dupIndex,
  swapIndex,
} from "../action";
import { Problem, forEachLeaf, forEachNode } from "../problem";

test("Path stores start, action ids, and end stack", () => {
  const path = {
    beg: [2, 1],
    actions: [-1],
    end: [2, -1],
  };

  expect(path.beg).toEqual([2, 1]);
  expect(path.actions).toEqual([-1]);
  expect(path.end).toEqual([2, -1]);
});

test("Problem normalizes keep order and counts stack vars", () => {
  const problem = new Problem(
    [-3, -2, -1, 0, 0],
    [-1, -3, -2],
    1,
    [[], [-1]],
  );

  expect(problem.keep).toEqual([-3, -2, -1]);
  expect(problem.stackVars).toBe(3);
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

test("forEachLeaf visits only terminal inputs", () => {
  const problem = new Problem(
    [-2, -1],
    [-2, -1],
    1,
    [[], [2, -1], [-2, BLANK_ACTION]],
  );
  const seen: [number, number][] = [];

  forEachLeaf(problem, (actionId, pos) => seen.push([actionId, pos]));

  expect(seen).toEqual([
    [-2, 0],
    [BLANK_ACTION, 1],
    [-1, 1],
  ]);
});

test("forEachNode visits the rule tree in postorder", () => {
  const problem = new Problem(
    [-2, -1],
    [-2, -1],
    1,
    [[], [2, -1], [-2, BLANK_ACTION]],
  );
  const seen: [number, number][] = [];

  forEachNode(problem, (actionId, pos) => seen.push([actionId, pos]));

  expect(seen).toEqual([
    [-2, 0],
    [BLANK_ACTION, 1],
    [2, 2],
    [-1, 1],
    [1, 2],
  ]);
});

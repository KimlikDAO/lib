import { expect, test } from "bun:test";
import {
  BLANK_ACTION,
  DUP_ACTION,
  DUP1_ACTION,
  DUP16_ACTION,
  POP_ACTION,
  Path,
  SWAP_ACTION,
  SWAP1_ACTION,
  SWAP16_ACTION,
  SearchState,
  dupIndex,
  swapIndex,
} from "../types";

test("Path stores start, action ids, and end state", () => {
  const start: SearchState = { stack: [2, 1], actions: [-1, -2] };
  const end: SearchState = { stack: [2, -1], actions: [-2] };

  const path = new Path(start, [-1], end);

  expect(path.start).toBe(start);
  expect(path.actions).toEqual([-1]);
  expect(path.end).toBe(end);
});

test("Path.extend appends an action and advances the end state", () => {
  const start: SearchState = { stack: [2, 1], actions: [-1, -2] };
  const mid: SearchState = { stack: [2, -1], actions: [-2] };
  const end: SearchState = { stack: [-3], actions: [] };

  const path = new Path(start, [-1], mid).extend(-2, end);

  expect(path.start).toBe(start);
  expect(path.actions).toEqual([-1, -2]);
  expect(path.end).toBe(end);
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

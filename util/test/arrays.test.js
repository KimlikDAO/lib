import { expect, test } from "bun:test";
import { chunk } from "../arrays";

/** @const {!Array<!Array>} */
const TestVectors = [
  // [input array, chunk size, expected result]
  [[], 2, []],
  [[1], 2, [[1]]],
  [[1, 2, 3, 4], 2, [[1, 2], [3, 4]]],
  [[1, 2, 3, 4, 5], 2, [[1, 2], [3, 4], [5]]],
  [[1, 2, 3], 1, [[1], [2], [3]]],
  [['a', 'b', 'c', 'd'], 3, [['a', 'b', 'c'], ['d']]],
  [[1, 2, 3, 4, 5, 6], 3, [[1, 2, 3], [4, 5, 6]]],
];

test("chunk arrays on sample points", () => {
  for (const [input, size, expected] of TestVectors) {
    expect(chunk(input, size)).toEqual(expected);
  }
});

test("throws on invalid chunk size", () => {
  expect(() => chunk([1, 2, 3], 0)).toThrow();
  expect(() => chunk([1, 2, 3], -1)).toThrow();
});

import { expect, test } from "bun:test";
import { chunk } from "../arrays";

test("chunk empty array", () => {
  /** @const {number[]} */
  const array = [];
  /** @const {number[][]} */
  const chunks = [];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk single element", () => {
  /** @const {number[]} */
  const array = [1];
  /** @const {number[][]} */
  const chunks = [[1]];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk even array", () => {
  /** @const {number[]} */
  const array = [1, 2, 3, 4];
  /** @const {number[][]} */
  const chunks = [[1, 2], [3, 4]];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk array with remainder", () => {
  /** @const {number[]} */
  const array = [1, 2, 3, 4, 5];
  /** @const {number[][]} */
  const chunks = [[1, 2], [3, 4], [5]];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk size 1", () => {
  /** @const {number[]} */
  const array = [1, 2, 3];
  /** @const {number[][]} */
  const chunks = [[1], [2], [3]];
  expect(chunk(array, 1)).toEqual(chunks);
});

test("chunk strings", () => {
  /** @const {string[]} */
  const array = ['a', 'b', 'c', 'd'];
  /** @const {string[][]} */
  const chunks = [['a', 'b', 'c'], ['d']];
  expect(chunk(array, 3)).toEqual(chunks);
});

test("chunk size 3", () => {
  /** @const {number[]} */
  const array = [1, 2, 3, 4, 5, 6];
  /** @const {number[][]} */
  const chunks = [[1, 2, 3], [4, 5, 6]];
  expect(chunk(array, 3)).toEqual(chunks);
});

test("throws on zero chunk size", () => {
  expect(() => chunk([1, 2, 3], 0)).toThrow();
});

test("throws on negative chunk size", () => {
  expect(() => chunk([1, 2, 3], -1)).toThrow();
});

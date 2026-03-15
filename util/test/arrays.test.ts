import { expect, test } from "bun:test";
import { chunk } from "../arrays";

test("chunk empty array", () => {
  const array: number[] = [];
  const chunks: number[][] = [];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk single element", () => {
  const array: number[] = [1];
  const chunks: number[][] = [[1]];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk even array", () => {
  const array: number[] = [1, 2, 3, 4];
  const chunks: number[][] = [
    [1, 2],
    [3, 4],
  ];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk array with remainder", () => {
  const array: number[] = [1, 2, 3, 4, 5];
  const chunks: number[][] = [
    [1, 2],
    [3, 4],
    [5],
  ];
  expect(chunk(array, 2)).toEqual(chunks);
});

test("chunk size 1", () => {
  const array: number[] = [1, 2, 3];
  const chunks: number[][] = [[1], [2], [3]];
  expect(chunk(array, 1)).toEqual(chunks);
});

test("chunk strings", () => {
  const array: string[] = ["a", "b", "c", "d"];
  const chunks: string[][] = [["a", "b", "c"], ["d"]];
  expect(chunk(array, 3)).toEqual(chunks);
});

test("chunk size 3", () => {
  const array: number[] = [1, 2, 3, 4, 5, 6];
  const chunks: number[][] = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  expect(chunk(array, 3)).toEqual(chunks);
});

test("non-positive n returns [] (pure, no throw)", () => {
  expect(chunk([1, 2, 3], 0)).toEqual([]);
  expect(chunk([1, 2, 3], -1)).toEqual([]);
});

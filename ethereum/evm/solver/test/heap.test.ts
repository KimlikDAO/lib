import { expect, test } from "bun:test";
import { Heap } from "../heap";

const numberCompare = (a: number, b: number): number => a - b;

test("Heap pops values in comparator order", () => {
  const heap = Heap.empty(numberCompare);
  for (const value of [5, 1, 4, 2, 3])
    heap.push(value);

  expect(heap.length).toBe(5);
  expect(heap.peek()).toBe(1);
  expect([
    heap.pop(),
    heap.pop(),
    heap.pop(),
    heap.pop(),
    heap.pop(),
    heap.pop(),
  ]).toEqual([1, 2, 3, 4, 5, undefined]);
  expect(heap.isEmpty).toBe(true);
});

test("Heap heapifies caller-owned storage in place", () => {
  const storage = [5, 1, 4, 2, 3];
  const heap = new Heap(storage, numberCompare);

  expect(heap.storage).toBe(storage);
  expect(heap.peek()).toBe(1);
  expect([heap.pop(), heap.pop(), heap.pop(), heap.pop(), heap.pop()])
    .toEqual([1, 2, 3, 4, 5]);
  expect(storage).toEqual([]);
});

test("Heap supports object priorities", () => {
  const heap = Heap.empty<{ id: string; f: number; g: number }>(
    (a, b) => a.f - b.f || b.g - a.g,
  );

  heap.push({ id: "wide", f: 4, g: 1 });
  heap.push({ id: "near", f: 2, g: 1 });
  heap.push({ id: "deep", f: 4, g: 3 });

  expect(heap.pop()!.id).toBe("near");
  expect(heap.pop()!.id).toBe("deep");
  expect(heap.pop()!.id).toBe("wide");
});

test("Heap.clear keeps the storage array reusable", () => {
  const storage = [3, 1, 2];
  const heap = new Heap(storage, numberCompare);

  expect(heap.clear()).toBe(heap);
  expect(storage).toEqual([]);
  heap.push(2).push(1);
  expect(storage.length).toBe(2);
  expect(heap.pop()).toBe(1);
});

test("Heap supports undefined as a stored value", () => {
  const heap = new Heap<number | undefined>(
    [1, undefined],
    (a, b) => (a ?? -1) - (b ?? -1),
  );

  expect(heap.pop()).toBeUndefined();
  expect(heap.pop()).toBe(1);
});

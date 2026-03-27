import { expect, test } from "bun:test";
import { CodeUpdater } from "../textual";

const range = (start: number, end: number) => ({ start, end } as { start: number, end: number });

test("replace using a node-like range and insert around it", (): void => {
  const source = "012345";
  const node = range(2, 4);
  const updater = new CodeUpdater();
  updater.insertBefore(node, "[");
  updater.replace(node, "AB");
  updater.insertAfter(node, "]");
  const out = updater.apply(source);

  expect(out).toBe("01[AB]45");
});

test("replace using a range-like object", (): void => {
  const updater = new CodeUpdater();
  updater.replace(range(1, 3), "X");
  const out = updater.apply("abcd");
  expect(out).toBe("aXd");
});

test("inserts at same position preserve call order", (): void => {
  const updater = new CodeUpdater();
  updater.replace(range(1, 1), "A");
  updater.replace(range(1, 1), "B");
  const out = updater.apply("xy");
  expect(out).toBe("xABy");
});

test("throws on overlapping edits", (): void => {
  expect(() => {
    const updater = new CodeUpdater();
    updater.replace(range(0, 2), "A");
    updater.replace(range(1, 3), "B");
    updater.apply("abcd");
  }).toThrow(/overlap/i);
});

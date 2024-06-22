import { expect, test } from "bun:test";
import { bekle, darboğaz } from "../promises";

test("`bekle()` works with no return value", async () => {
  const t = performance.now();
  await bekle(200);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(195);
  expect(dt).toBeLessThan(250);
});

test("should complete with no log when full bandwidth", async () => {
  const db = darboğaz(5);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(100, 1)),
    db(() => bekle(100, 2)),
    db(() => bekle(100, 3)),
    db(() => bekle(100, 4)),
    db(() => bekle(100, 5)),
  ])).toEqual([1, 2, 3, 4, 5]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(95);
  expect(dt).toBeLessThan(150);
});

test("should complete with no log when full bandwidth", async () => {
  const db = darboğaz(2);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(100, 1)),
    db(() => bekle(100, 2)),
    db(() => bekle(100, 3)),
    db(() => bekle(100, 4)),
    db(() => bekle(100, 5)),
  ])).toEqual([1, 2, 3, 4, 5]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(290);
  expect(dt).toBeLessThan(350);
});

test("should execute sequantially with bandwidth 1", async () => {
  const db = darboğaz(1);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(100, 1)),
    db(() => bekle(100, 2)),
    db(() => bekle(100, 3)),
    db(() => bekle(100, 4)),
    db(() => bekle(100, 5)),
  ])).toEqual([1, 2, 3, 4, 5]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(490);
  expect(dt).toBeLessThan(550);
});

test("the continuation should not get bottlenecked", async () => {
  const db = darboğaz(1);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(100, 1)).then(() => bekle(1000, 11)),
    db(() => bekle(100, 2)).then(() => bekle(1000, 22)),
    db(() => bekle(100, 3)).then(() => bekle(1000, 33)),
    db(() => bekle(100, 4)).then(() => bekle(1000, 44)),
    db(() => bekle(100, 5)).then(() => bekle(1000, 55)),
  ])).toEqual([11, 22, 33, 44, 55]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(1490);
  expect(dt).toBeLessThan(1550);
});

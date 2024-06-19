import { expect, test } from "bun:test";
import { bekle, darboğaz } from "../promises";

test("should complete with no log when full bandwidth", async () => {
  const db = darboğaz(5);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(1, 100)),
    db(() => bekle(2, 100)),
    db(() => bekle(3, 100)),
    db(() => bekle(4, 100)),
    db(() => bekle(5, 100)),
  ])).toEqual([1, 2, 3, 4, 5]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(95);
  expect(dt).toBeLessThan(120);
});

test("should complete with no log when full bandwidth", async () => {
  const db = darboğaz(2);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(1, 100)),
    db(() => bekle(2, 100)),
    db(() => bekle(3, 100)),
    db(() => bekle(4, 100)),
    db(() => bekle(5, 100)),
  ])).toEqual([1, 2, 3, 4, 5]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(290);
  expect(dt).toBeLessThan(330);
});

test("should execute sequantially with bandwidth 1", async () => {
  const db = darboğaz(1);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(1, 100)),
    db(() => bekle(2, 100)),
    db(() => bekle(3, 100)),
    db(() => bekle(4, 100)),
    db(() => bekle(5, 100)),
  ])).toEqual([1, 2, 3, 4, 5]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(490);
  expect(dt).toBeLessThan(530);
});

test("the continuation should not get bottlenecked", async () => {
  const db = darboğaz(1);
  const t = performance.now();
  expect(await Promise.all([
    db(() => bekle(1, 100)).then(() => bekle(11, 1000)),
    db(() => bekle(2, 100)).then(() => bekle(22, 1000)),
    db(() => bekle(3, 100)).then(() => bekle(33, 1000)),
    db(() => bekle(4, 100)).then(() => bekle(44, 1000)),
    db(() => bekle(5, 100)).then(() => bekle(55, 1000)),
  ])).toEqual([11, 22, 33, 44, 55]);
  const dt = performance.now() - t;
  expect(dt).toBeGreaterThan(1490);
  expect(dt).toBeLessThan(1550);
});

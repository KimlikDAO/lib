import { describe, expect, it } from "bun:test";
import { Throttle, wait } from "../promises";

describe("wait", () => {
  it("waits with no return value", async () => {
    const t = performance.now();
    await wait(200);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(195);
    expect(dt).toBeLessThan(250);
  });
});

describe("Throttle", () => {
  it("runs at full speed when slots >= task count", async () => {
    const th = new Throttle(5);
    const t = performance.now();
    expect(
      await Promise.all([
        th.add(() => wait(100, 1)),
        th.add(() => wait(100, 2)),
        th.add(() => wait(100, 3)),
        th.add(() => wait(100, 4)),
        th.add(() => wait(100, 5)),
      ]),
    ).toEqual([1, 2, 3, 4, 5]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(95);
    expect(dt).toBeLessThan(150);
  });

  it("queues when slots < task count", async () => {
    const th = new Throttle(2);
    const t = performance.now();
    expect(
      await Promise.all([
        th.add(() => wait(100, 1)),
        th.add(() => wait(100, 2)),
        th.add(() => wait(100, 3)),
        th.add(() => wait(100, 4)),
        th.add(() => wait(100, 5)),
      ]),
    ).toEqual([1, 2, 3, 4, 5]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(290);
    expect(dt).toBeLessThan(350);
  });

  it("sequential when one slot", async () => {
    const th = new Throttle(1);
    const t = performance.now();
    expect(
      await Promise.all([
        th.add(() => wait(100, 1)),
        th.add(() => wait(100, 2)),
        th.add(() => wait(100, 3)),
        th.add(() => wait(100, 4)),
        th.add(() => wait(100, 5)),
      ]),
    ).toEqual([1, 2, 3, 4, 5]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(490);
    expect(dt).toBeLessThan(550);
  });

  it("does not throttle promise continuations after add resolves", async () => {
    const th = new Throttle(1);
    const t = performance.now();
    expect(
      await Promise.all([
        th.add(() => wait(100, 1)).then(() => wait(1000, 11)),
        th.add(() => wait(100, 2)).then(() => wait(1000, 22)),
        th.add(() => wait(100, 3)).then(() => wait(1000, 33)),
        th.add(() => wait(100, 4)).then(() => wait(1000, 44)),
        th.add(() => wait(100, 5)).then(() => wait(1000, 55)),
      ]),
    ).toEqual([11, 22, 33, 44, 55]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(1490);
    expect(dt).toBeLessThan(1550);
  });
});

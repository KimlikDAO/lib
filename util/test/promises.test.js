import { describe, expect, it } from "bun:test";
import { wait, throttle } from "../promises";

describe("wait", () => {
  it("should wait specified time with no return value", async () => {
    const t = performance.now();
    await wait(200);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(195);
    expect(dt).toBeLessThan(250);
  });
});

describe("throttle", () => {
  it("should run at full speed with sufficient bandwidth", async () => {
    const th = throttle(5);
    const t = performance.now();
    expect(await Promise.all([
      th(() => wait(100, 1)),
      th(() => wait(100, 2)),
      th(() => wait(100, 3)),
      th(() => wait(100, 4)),
      th(() => wait(100, 5)),
    ])).toEqual([1, 2, 3, 4, 5]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(95);
    expect(dt).toBeLessThan(150);
  });

  it("should throttle with limited bandwidth", async () => {
    const th = throttle(2);
    const t = performance.now();
    expect(await Promise.all([
      th(() => wait(100, 1)),
      th(() => wait(100, 2)),
      th(() => wait(100, 3)),
      th(() => wait(100, 4)),
      th(() => wait(100, 5)),
    ])).toEqual([1, 2, 3, 4, 5]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(290);
    expect(dt).toBeLessThan(350);
  });

  it("should execute sequentially with bandwidth 1", async () => {
    const th = throttle(1);
    const t = performance.now();
    expect(await Promise.all([
      th(() => wait(100, 1)),
      th(() => wait(100, 2)),
      th(() => wait(100, 3)),
      th(() => wait(100, 4)),
      th(() => wait(100, 5)),
    ])).toEqual([1, 2, 3, 4, 5]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(490);
    expect(dt).toBeLessThan(550);
  });

  it("should not throttle promise continuations", async () => {
    const th = throttle(1);
    const t = performance.now();
    expect(await Promise.all([
      th(() => wait(100, 1)).then(() => wait(1000, 11)),
      th(() => wait(100, 2)).then(() => wait(1000, 22)),
      th(() => wait(100, 3)).then(() => wait(1000, 33)),
      th(() => wait(100, 4)).then(() => wait(1000, 44)),
      th(() => wait(100, 5)).then(() => wait(1000, 55)),
    ])).toEqual([11, 22, 33, 44, 55]);
    const dt = performance.now() - t;
    expect(dt).toBeGreaterThan(1490);
    expect(dt).toBeLessThan(1550);
  });
});

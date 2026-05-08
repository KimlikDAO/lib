import { expect, test } from "bun:test";
import { Expression } from "../expression";
import { Fragment } from "../fragment";
import { Op } from "../opcodes";
import { set, SetStatement } from "../statement";
import { Locn, Size } from "../types";

test("set constructs name-binding statements", () => {
  const init = new Expression([], Fragment.from({
    ensure: [Size],
    code: [Op.CALLDATASIZE],
  }));

  expect(set("x", init)).toMatchObject({
    name: "x",
    init,
  });
  expect(set(["x", "y"], init)).toMatchObject({
    name: ["x", "y"],
    init,
  });
  expect(set({ x: "a", y: "b" }, init)).toMatchObject({
    name: { x: "a", y: "b" },
    init,
  });
});

test("set materializes typed literals", () => {
  const stmt = set("loc", Locn, 0);
  const setUntyped = set as unknown as (name: string, lit: number) => SetStatement;

  expect(stmt).toBeInstanceOf(SetStatement);
  expect(String((stmt.init as Expression).frag.signature)).toBe("() → 0|Locn");
  expect(() => setUntyped("loc", 0))
    .toThrow("set requires an expression, stack ref, or typed literal");
});

import { expect, test } from "bun:test";
import { parseType } from "../parser.js";

test("", () => {
  const fn = parseType("Map<string, number> | null");
  expect(fn.toClosureExpr()).toBe("!Map<string,number>|null");
});

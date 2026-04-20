import { expect, test } from "bun:test";
import { removeOrigin } from "../source";

test("removeOrigin strips package and module prefixes", () => {
  expect(removeOrigin("package:@kimlikdao/kdts")).toBe("@kimlikdao/kdts");
  expect(removeOrigin("module:/tmp/entry.ts")).toBe("/tmp/entry.ts");
});

test("removeOrigin leaves global unchanged", () => {
  expect(removeOrigin("global")).toBe("global");
});

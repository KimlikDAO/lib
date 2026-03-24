import { describe, expect, test } from "bun:test";
import { inferredTypeOf } from "./harness";

describe("inferFromExpression", () => {
  const inferred = [
    { input: "2", type: "number" },
    { input: '"x"', type: "string" },
    { input: "true", type: "boolean" },
    { input: "1n", type: "bigint" },
    { input: "null", type: "null" },
    { input: "new Map<K, V>()", type: "Map<K, V>" },
    { input: "new Box<Result>()", type: "Box<Result>" }
  ];

  for (const { input, type } of inferred) {
    test(`infers ${type} from ${input}`, () => {
      expect(inferredTypeOf(input)).toBe(type);
    });
  }

  const uninferred = [
    "foo()",
    "new Map()",
    "{ value: 1 }",
    "[1, 2, 3]"
  ];

  for (const input of uninferred) {
    test(`does not infer from ${input}`, () => {
      expect(inferredTypeOf(input)).toBeUndefined();
    });
  }
});

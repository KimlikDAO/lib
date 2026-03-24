import { describe, expect, test } from "bun:test";
import { inferredTypeOf } from "./harness";

const expectInferred = (input: string, type: string) => (): void => {
  expect(inferredTypeOf(input)).toBe(type);
};

const expectUninferred = (input: string) => (): void => {
  expect(inferredTypeOf(input)).toBeUndefined();
};

describe("inferFromExpression", () => {
  test('infers number from 2', expectInferred("2", "number"));
  test('infers string from "x"', expectInferred('"x"', "string"));
  test("infers boolean from true", expectInferred("true", "boolean"));
  test("infers bigint from 1n", expectInferred("1n", "bigint"));
  test("infers null from null", expectInferred("null", "null"));
  test(
    "infers Map<K, V> from new Map<K, V>()",
    expectInferred("new Map<K, V>()", "Map<K, V>")
  );
  test(
    "infers Box<Result> from new Box<Result>()",
    expectInferred("new Box<Result>()", "Box<Result>")
  );

  test("does not infer from foo()", expectUninferred("foo()"));
  test("does not infer from new Map()", expectUninferred("new Map()"));
  test("does not infer from { value: 1 }", expectUninferred("{ value: 1 }"));
  test("does not infer from [1, 2, 3]", expectUninferred("[1, 2, 3]"));
});

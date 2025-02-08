import { describe, expect, test } from "bun:test";
import {
  FunctionType,
  GenericType,
  PrimitiveType,
  StructType,
  UnionType
} from "../types";

describe("toExpr() tests", () => {
  test("PrimitiveType", () => {
    const string = new PrimitiveType("string", true);
    expect(string.toExpr()).toBe("?string");
    const bigint = new PrimitiveType("bigint", false);
    expect(bigint.toExpr()).toBe("bigint");
  });

  test("GenericType, array specialization", () => {
    const arrayOfString = new GenericType("Array", [
      new PrimitiveType("string", false)
    ], true);
    expect(arrayOfString.toExpr()).toBe("?(string[])");
    const arrayOfNullable = new GenericType("Array", [
      new PrimitiveType("string", true)
    ], true);
    expect(arrayOfNullable.toExpr()).toBe("?(?string[])");
  });

  test("GenericType", () => {
    const record = new GenericType("Record", [
      new PrimitiveType("string", false),
      new PrimitiveType("bigint", false)
    ], true);

    expect(record.toExpr()).toBe("?Record<string, bigint>");
  })
});

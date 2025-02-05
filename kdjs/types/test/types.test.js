import { expect, test } from "bun:test";
import {
  FunctionType,
  GenericType,
  PrimitiveType,
  UnionType
} from "../types";

test("FunctionType.toString()", () => {
  const returnType = new PrimitiveType("string", false);
  const paramTypes = [
    new PrimitiveType("number", false),
    new PrimitiveType("boolean", true)
  ];
  const fn = new FunctionType(returnType, paramTypes, 1);
  expect(fn.toString()).toBe("function(number,?boolean=):string");
});

test("GenericType.toString()", () => {
  const arrayType = new GenericType("Array", [new PrimitiveType("string")], false);
  console.log(arrayType.toString());
  expect(arrayType.toString()).toBe("!Array<string>");

  const objectType = new GenericType("Object", [
    new PrimitiveType("string"), new PrimitiveType("number")
  ], false);
  expect(objectType.toString()).toBe("!Object<string, number>");
});

test("UnionType.toString()", () => {
  const unionType = new UnionType([
    new PrimitiveType("string"),
    new PrimitiveType("number"),
    new PrimitiveType("null")
  ]);
  expect(unionType.toString()).toBe("string | number | null");
});

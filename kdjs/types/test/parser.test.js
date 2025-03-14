import { describe, expect, it } from "bun:test";
import { parseType } from "../parser";
import {
  GenericType,
  InstanceType,
  PrimitiveType,
  UnionType,
  StructType,
  FunctionType
} from "../types";

describe("Type Parser", () => {
  it("should parse primitive types", () => {
    const stringType = /** @type {!PrimitiveType} */(parseType("string"));
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
    expect(stringType.isNullable()).toBe(false);

    const nullableString = /** @type {!PrimitiveType} */(parseType("?string"));
    expect(nullableString).toBeInstanceOf(PrimitiveType);
    expect(nullableString.name).toBe("string");
    expect(nullableString.isNullable()).toBe(true);
  });

  it("should parse instance types", () => {
    const userType = /** @type {!InstanceType} */(parseType("User"));
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
    expect(userType.isNullable()).toBe(false);

    const nullableUser = /** @type {!InstanceType} */(parseType("?User"));
    expect(nullableUser).toBeInstanceOf(InstanceType);
    expect(nullableUser.name).toBe("User");
    expect(nullableUser.isNullable()).toBe(true);
  });

  it("should parse generic types", () => {
    const mapType = /** @type {!GenericType} */(parseType("Map<string, number>"));
    expect(mapType).toBeInstanceOf(GenericType);
    expect(mapType.name).toBe("Map");
    expect(mapType.isNullable()).toBe(false);
    expect(mapType.params.length).toBe(2);
    const stringType = /** @type {!PrimitiveType} */(mapType.params[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
    const numberType = /** @type {!PrimitiveType} */(mapType.params[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe("number");

    const nullableMap = /** @type {!GenericType} */(parseType("?Map<string, number>"));
    expect(nullableMap).toBeInstanceOf(GenericType);
    expect(nullableMap.isNullable()).toBe(true);
    expect(nullableMap.params.length).toBe(2);
  });

  it("should parse array shorthand notation", () => {
    const stringArray = /** @type {!GenericType} */(parseType("string[]"));
    expect(stringArray).toBeInstanceOf(GenericType);
    expect(stringArray.name).toBe("Array");
    expect(stringArray.params.length).toBe(1);
    const stringType = /** @type {!PrimitiveType} */(stringArray.params[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");

    const userArray = /** @type {!GenericType} */(parseType("User[]"));
    expect(userArray).toBeInstanceOf(GenericType);
    expect(userArray.name).toBe("Array");
    expect(userArray.params.length).toBe(1);
    const userType = /** @type {!InstanceType} */(userArray.params[0]);
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");

    const nestedArray = /** @type {!GenericType} */(parseType("string[][]"));
    expect(nestedArray).toBeInstanceOf(GenericType);
    expect(nestedArray.name).toBe("Array");
    expect(nestedArray.params.length).toBe(1);
    const nestedStringArray = /** @type {!GenericType} */(nestedArray.params[0]);
    expect(nestedStringArray).toBeInstanceOf(GenericType);
    expect(nestedStringArray.name).toBe("Array");
    expect(nestedStringArray.params.length).toBe(1);
    const nestedStringType = /** @type {!PrimitiveType} */(nestedStringArray.params[0]);
    expect(nestedStringType).toBeInstanceOf(PrimitiveType);
    expect(nestedStringType.name).toBe("string");
  });

  it("should parse union types", () => {
    const union = /** @type {!UnionType} */(parseType("string | number"));
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    const stringType = /** @type {!PrimitiveType} */(union.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
    const numberType = /** @type {!PrimitiveType} */(union.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe("number");

    const complexUnion = /** @type {!UnionType} */(parseType("User | Map<string, number> | null"));
    expect(complexUnion).toBeInstanceOf(UnionType);
    expect(complexUnion.types.length).toBe(2); // null is handled specially
    expect(complexUnion.isNullable()).toBe(true);

    const nullableOptUnion = /** @type {!UnionType} */(parseType("string | bigint | null | undefined"));
    expect(nullableOptUnion).toBeInstanceOf(UnionType);
    expect(nullableOptUnion.types.length).toBe(2);
    expect(nullableOptUnion.isNullable()).toBe(true);
    expect(nullableOptUnion.isOptional()).toBe(true);
  });

  it.only("should respect precedence of union types", () => {
    const union = /** @type {!GenericType} */(parseType("(string | number)[]"));
    expect(union).toBeInstanceOf(GenericType);
    expect(union.name).toBe("Array");
    const innerUnion = /** @type {!UnionType} */(union.params[0]);
    expect(innerUnion).toBeInstanceOf(UnionType);
    expect(innerUnion.types.length).toBe(2);
    const stringType = /** @type {!PrimitiveType} */(innerUnion.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
    const numberType = /** @type {!PrimitiveType} */(innerUnion.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe("number");
  });

  // it("should parse parenthesized types", () => {
  //   const parenthesized = parseType("(string | number)");
  //   expect(parenthesized).toBeInstanceOf(UnionType);
  //   expect(parenthesized.types.length).toBe(2);

  //   const arrayOfUnion = parseType("(string | number)[]");
  //   expect(arrayOfUnion).toBeInstanceOf(GenericType);
  //   expect(arrayOfUnion.name).toBe("Array");
  //   expect(arrayOfUnion.params[0]).toBeInstanceOf(UnionType);
  // });

  // it("should parse complex nested types", () => {
  //   const complex = parseType("Array<Map<string, User[]> | number>");
  //   expect(complex).toBeInstanceOf(GenericType);
  //   expect(complex.name).toBe("Array");
  //   expect(complex.params[0]).toBeInstanceOf(UnionType);

  //   const withSpaces = parseType("Array < string | number > | undefined");
  //   expect(withSpaces).toBeInstanceOf(UnionType);
  //   expect(withSpaces.types[0]).toBeInstanceOf(GenericType);
  //   expect(withSpaces.types[1]).toBeInstanceOf(PrimitiveType);
  //   expect(withSpaces.types[1].name).toBe("undefined");
  // });

  // it("should handle the example from the original test", () => {
  //   const ast = parseType("Array<number|string>|undefined");
  //   expect(ast).toBeInstanceOf(UnionType);
  //   expect(ast.types.length).toBe(2);
  //   expect(ast.types[0]).toBeInstanceOf(GenericType);
  //   expect(ast.types[0].name).toBe("Array");
  //   expect(ast.types[0].params[0]).toBeInstanceOf(UnionType);
  //   expect(ast.types[1]).toBeInstanceOf(PrimitiveType);
  //   expect(ast.types[1].name).toBe("undefined");
  // });

  // it("should handle null in union types correctly", () => {
  //   const nullableType = parseType("string | null");
  //   expect(nullableType).toBeInstanceOf(UnionType);
  //   expect(nullableType.types.length).toBe(1);
  //   expect(nullableType.types[0]).toBeInstanceOf(PrimitiveType);
  //   expect(nullableType.types[0].name).toBe("string");
  //   expect(nullableType.isNullable()).toBe(true);

  //   // Test with null first
  //   const nullableType2 = parseType("null | number");
  //   expect(nullableType2).toBeInstanceOf(UnionType);
  //   expect(nullableType2.types.length).toBe(1);
  //   expect(nullableType2.types[0]).toBeInstanceOf(PrimitiveType);
  //   expect(nullableType2.types[0].name).toBe("number");
  //   expect(nullableType2.isNullable()).toBe(true);

  //   // Test with multiple types
  //   const multiType = parseType("string | number | null");
  //   expect(multiType).toBeInstanceOf(UnionType);
  //   expect(multiType.types.length).toBe(2);
  //   expect(multiType.isNullable()).toBe(true);
  // });

  // it("should parse struct types", () => {
  //   const simpleStruct = parseType("{name: string, age: number}");
  //   expect(simpleStruct).toBeInstanceOf(StructType);
  //   expect(Object.keys(simpleStruct.members).length).toBe(2);
  //   expect(simpleStruct.members.name).toBeInstanceOf(PrimitiveType);
  //   expect(simpleStruct.members.name.name).toBe("string");
  //   expect(simpleStruct.members.age).toBeInstanceOf(PrimitiveType);
  //   expect(simpleStruct.members.age.name).toBe("number");

  //   // Test with optional properties
  //   const withOptional = parseType("{name?: string, age: number}");
  //   expect(withOptional).toBeInstanceOf(StructType);
  //   expect(withOptional.members.name).toBeInstanceOf(UnionType);
  //   expect(withOptional.members.name.types.length).toBe(2);
  //   expect(withOptional.members.name.types[1].name).toBe("undefined");

  //   // Test with special characters in property names
  //   const withSpecialChars = parseType("{name$: string, _id: number}");
  //   expect(withSpecialChars).toBeInstanceOf(StructType);
  //   expect("name$" in withSpecialChars.members).toBe(true);
  //   expect(withSpecialChars.members["name$"]).toBeInstanceOf(UnionType);
  //   expect("_id" in withSpecialChars.members).toBe(true);

  //   // Test with nested structs
  //   const nestedStruct = parseType("{user: {name: string, age: number}, active: boolean}");
  //   expect(nestedStruct).toBeInstanceOf(StructType);
  //   expect(nestedStruct.members.user).toBeInstanceOf(StructType);
  //   expect(nestedStruct.members.active).toBeInstanceOf(PrimitiveType);

  //   // Test with array of structs
  //   const arrayOfStructs = parseType("{users: {name: string, age: number}[]}");
  //   expect(arrayOfStructs).toBeInstanceOf(StructType);
  //   expect(arrayOfStructs.members.users).toBeInstanceOf(GenericType);
  //   expect(arrayOfStructs.members.users.name).toBe("Array");
  //   expect(arrayOfStructs.members.users.params[0]).toBeInstanceOf(StructType);

  //   // Test with $ suffix for optional properties
  //   /** @type {!StructType} */
  //   const withDollarOptional = /** @type {!StructType} */ (parseType("{name$: string, age: number}"));
  //   expect(withDollarOptional).toBeInstanceOf(StructType);
  //   expect(withDollarOptional.members["name$"]).toBeInstanceOf(UnionType);
  //   /** @type {!UnionType} */
  //   const name$ = /** @type {!UnionType} */ (withDollarOptional.members["name$"]);
  //   expect(name$.types.length).toBe(2);
  //   expect(/** @type {!PrimitiveType} */(name$.types[1]).name).toBe("undefined");
  // });

  // it("should parse function types", () => {
  //   // Basic function type
  //   const basicFn = parseType("() => void");
  //   expect(basicFn).toBeInstanceOf(FunctionType);
  //   expect(basicFn.params.length).toBe(0);
  //   expect(basicFn.returnType).toBeInstanceOf(PrimitiveType);
  //   expect(basicFn.returnType.name).toBe("void");
  //   expect(basicFn.optionalAfter).toBe(0);

  //   // Function with parameters (all named)
  //   const fnWithParams = parseType("(a: string, b: number) => boolean");
  //   expect(fnWithParams).toBeInstanceOf(FunctionType);
  //   expect(fnWithParams.params.length).toBe(2);
  //   expect(fnWithParams.params[0]).toBeInstanceOf(PrimitiveType);
  //   expect(fnWithParams.params[0].name).toBe("string");
  //   expect(fnWithParams.params[1]).toBeInstanceOf(PrimitiveType);
  //   expect(fnWithParams.params[1].name).toBe("number");
  //   expect(fnWithParams.returnType).toBeInstanceOf(PrimitiveType);
  //   expect(fnWithParams.returnType.name).toBe("boolean");

  //   // Function with optional parameters (? syntax)
  //   const fnWithOptionalParams = parseType("(name: string, age?: number) => boolean");
  //   expect(fnWithOptionalParams).toBeInstanceOf(FunctionType);
  //   expect(fnWithOptionalParams.params.length).toBe(2);
  //   expect(fnWithOptionalParams.optionalAfter).toBe(1); // Second parameter is optional

  //   // Function with optional parameters (= syntax)
  //   const fnWithOptionalParams2 = parseType("(name: string, age: number=) => boolean");
  //   expect(fnWithOptionalParams2).toBeInstanceOf(FunctionType);
  //   expect(fnWithOptionalParams2.params.length).toBe(2);
  //   expect(fnWithOptionalParams2.optionalAfter).toBe(1); // Second parameter is optional

  //   // Function with this parameter
  //   const fnWithThis = parseType("(this: Context, value: string) => void");
  //   expect(fnWithThis).toBeInstanceOf(FunctionType);
  //   expect(fnWithThis.params.length).toBe(1); // 'this' is not counted in params
  //   expect(fnWithThis.thisType).toBeInstanceOf(InstanceType);
  //   expect(fnWithThis.thisType.name).toBe("Context");
  //   expect(fnWithThis.isMethod()).toBe(true);

  //   // Complex function type
  //   const complexFn = parseType("(callback: (error: Error=) => void, options?: {timeout: number}) => Promise<string>");
  //   expect(complexFn).toBeInstanceOf(FunctionType);
  //   expect(complexFn.params.length).toBe(2);
  //   expect(complexFn.params[0]).toBeInstanceOf(FunctionType);
  //   expect(complexFn.optionalAfter).toBe(1); // Second parameter is optional
  //   expect(complexFn.returnType).toBeInstanceOf(GenericType);
  //   expect(complexFn.returnType.name).toBe("Promise");
  // });
});

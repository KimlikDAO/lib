import { describe, expect, it, test } from "bun:test";
import { parseType } from "../parser";
import {
  FunctionType,
  GenericType,
  InstanceType,
  PrimitiveType,
  StructType,
  TopType,
  UnionType
} from "../types";

describe("Primitives, TopTypes and simple UnionTypes", () => {
  it("parses string", () => {
    const stringType = /** @type {!PrimitiveType} */(parseType("string"));
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
    expect(stringType.isNullable()).toBe(false);
  });

  it("parses ?string", () => {
    const nullableString = /** @type {!PrimitiveType} */(parseType("?string"));
    expect(nullableString).toBeInstanceOf(PrimitiveType);
    expect(nullableString.name).toBe("string");
    expect(nullableString.isNullable()).toBe(true);
  });

  it("parses null", () => {
    const nullType = /** @type {!PrimitiveType} */(parseType("null"));
    expect(nullType).toBeInstanceOf(PrimitiveType);
    expect(nullType.name).toBe("null");
    expect(nullType.isNullable()).toBe(true);
  });

  it("parses void", () => {
    const voidType = /** @type {!PrimitiveType} */(parseType("void"));
    expect(voidType).toBeInstanceOf(PrimitiveType);
    expect(voidType.name).toBe("undefined");
    expect(voidType.isNullable()).toBe(false);
  });

  it("parses any", () => {
    const anyType = /** @type {!TopType} */(parseType("any"));
    expect(anyType).toBeInstanceOf(TopType);
    expect(anyType.name).toBe("?");
    expect(anyType.isNullable()).toBe(true);
    expect(anyType.isOptional()).toBe(true);
  });

  it("parses unknown", () => {
    const unknownType = /** @type {!TopType} */(parseType("unknown"));
    expect(unknownType).toBeInstanceOf(TopType);
    expect(unknownType.name).toBe("*");
    expect(unknownType.isNullable()).toBe(true);
    expect(unknownType.isOptional()).toBe(true);
  });

  it("parses instance types", () => {
    const userType = /** @type {!InstanceType} */(parseType("User"));
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
    expect(userType.isNullable()).toBe(false);

    const nullableUser = /** @type {!InstanceType} */(parseType("?User"));
    expect(nullableUser).toBeInstanceOf(InstanceType);
    expect(nullableUser.name).toBe("User");
    expect(nullableUser.isNullable()).toBe(true);
  });

  it("parses explicit nullable string", () => {
    const nullableType = parseType("string | null");
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe("string");
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses shorthand nullable string", () => {
    const nullableType = parseType("?string");
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe("string");
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses scoped instance types", () => {
    const scopedType = /** @type {!InstanceType} */(parseType("namespace.MyClass"));
    expect(scopedType).toBeInstanceOf(InstanceType);
    expect(scopedType.name).toBe("namespace.MyClass");
    expect(scopedType.isNullable()).toBe(false);
  });
});

describe("Unions", () => {
  it("parses null|string", () => {
    const nullableType = parseType("null | string");
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe("string");
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses (string|number)", () => {
    const union = /** @type {!UnionType} */(parseType("string | number"));
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    const stringType = /** @type {!PrimitiveType} */(union.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
    const numberType = /** @type {!PrimitiveType} */(union.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe("number");
  });

  it("should parse (string|bigint|null|undefined)", () => {
    const nullableOptUnion = /** @type {!UnionType} */(parseType("string | bigint | null | undefined"));
    expect(nullableOptUnion).toBeInstanceOf(UnionType);
    expect(nullableOptUnion.types.length).toBe(2);
    expect(nullableOptUnion.isNullable()).toBe(true);
    expect(nullableOptUnion.isOptional()).toBe(true);
  });
});

describe("Arrays", () => {
  it("parses array shorthand notation", () => {
    const stringArray = /** @type {!GenericType} */(parseType("string[]"));
    expect(stringArray).toBeInstanceOf(GenericType);
    expect(stringArray.name).toBe("Array");
    expect(stringArray.params.length).toBe(1);
    const stringType = /** @type {!PrimitiveType} */(stringArray.params[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe("string");
  });

  it("should parse User[]", () => {
    const userArray = /** @type {!GenericType} */(parseType("User[]"));
    expect(userArray).toBeInstanceOf(GenericType);
    expect(userArray.name).toBe("Array");
    expect(userArray.params.length).toBe(1);
    const userType = /** @type {!InstanceType} */(userArray.params[0]);
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
  });
  
  it("parses string[][]", () => {
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
})

describe("Unions and generics", () => {
  it("parses User|Map<string,number>|null", () => {
    const complexUnion = /** @type {!UnionType} */(parseType("User | Map<string, number> | null"));
    expect(complexUnion).toBeInstanceOf(UnionType);
    expect(complexUnion.types.length).toBe(2);
    expect(complexUnion.isNullable()).toBe(true);
  });

  it("parses Map<string,number>", () => {
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
  });

  it("should parse ?Map<string,number>", () => {
    const nullableMap = /** @type {!GenericType} */(parseType("?Map<string, number>"));
    expect(nullableMap).toBeInstanceOf(GenericType);
    expect(nullableMap.isNullable()).toBe(true);
    expect(nullableMap.params.length).toBe(2);
  });

  it("should respect precedence of union types", () => {
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

  it("should parse parenthesized types", () => {
    const parenthesized = parseType("(string | number)");
    expect(parenthesized).toBeInstanceOf(UnionType);
    expect(parenthesized.types.length).toBe(2);

    const arrayOfUnion = parseType("(string | number)[]");
    expect(arrayOfUnion).toBeInstanceOf(GenericType);
    expect(arrayOfUnion.name).toBe("Array");
    expect(arrayOfUnion.params[0]).toBeInstanceOf(UnionType);
  });

  it("should parse Array<Map<string, User[]> | number>", () => {
    const complex = parseType("Array<Map<string, User[]> | number>");
    expect(complex).toBeInstanceOf(GenericType);
    expect(complex.name).toBe("Array");
    expect(complex.params[0]).toBeInstanceOf(UnionType);
    const union = /** @type {!UnionType} */(complex.params[0]);
    expect(union.types.length).toBe(2);
    const mapType = /** @type {!GenericType} */(union.types[0]);
    expect(mapType).toBeInstanceOf(GenericType);
    expect(mapType.name).toBe("Map");
    expect(mapType.params.length).toBe(2);
    const arrayType = /** @type {!GenericType} */(mapType.params[1]);
    expect(arrayType).toBeInstanceOf(GenericType);
    expect(arrayType.name).toBe("Array");
    expect(union.types[1]).toBeInstanceOf(PrimitiveType);
    expect(union.types[1].name).toBe("number");
  });

  it("should ignore extra spaces", () => {
    const withSpaces = parseType("Array < string | number >   | undefined");
    expect(withSpaces).toBeInstanceOf(GenericType);
    expect(withSpaces.name).toBe("Array");
    expect(withSpaces.params[0]).toBeInstanceOf(UnionType);
    expect(withSpaces.isOptional()).toBeTrue();
    const unionWithSpaces = /** @type {!UnionType} */(withSpaces.params[0]);
    expect(unionWithSpaces.types.length).toBe(2);
    expect(unionWithSpaces.types[0]).toBeInstanceOf(PrimitiveType);
    expect(unionWithSpaces.types[0].name).toBe("string");
    expect(unionWithSpaces.types[1]).toBeInstanceOf(PrimitiveType);
    expect(unionWithSpaces.types[1].name).toBe("number");
  });
});

describe("Structs", () => {
  it("parses {name:string, age:number}", () => {
    const simpleStruct = parseType("{name: string, age: number}");
    expect(simpleStruct).toBeInstanceOf(StructType);
    expect(Object.keys(simpleStruct.members).length).toBe(2);
    expect(simpleStruct.members["name"]).toBeInstanceOf(PrimitiveType);
    expect(simpleStruct.members["name"].name).toBe("string");
    expect(simpleStruct.members["age"]).toBeInstanceOf(PrimitiveType);
    expect(simpleStruct.members["age"].name).toBe("number");
  });

  it("parses {name?:string, age:number}", () => {
      const optProp = parseType("{name?: string, age: number}");
      expect(optProp).toBeInstanceOf(StructType);
      expect(optProp.members["name"]).toBeInstanceOf(PrimitiveType);
      expect(optProp.members["name"].name).toBe("string");
      expect(optProp.members["name"].isOptional()).toBeTrue();
  });

  it("parses {name$:string, age:number}", () => {
    const dollarOpt = parseType("{name$: string, age: number}");
    expect(dollarOpt).toBeInstanceOf(StructType);
    expect(dollarOpt.members["name$"]).toBeInstanceOf(PrimitiveType);
    expect(dollarOpt.members["name$"].name).toBe("string");
    expect(dollarOpt.members["name$"].isOptional()).toBeTrue();
  });

  it("handles nested structs", () => {
    const nestedStruct = parseType("{user: {name: string, age: number}, active: boolean}");
    expect(nestedStruct).toBeInstanceOf(StructType);
    expect(nestedStruct.members["user"]).toBeInstanceOf(StructType);
    expect(nestedStruct.members["active"]).toBeInstanceOf(PrimitiveType);
    expect(nestedStruct.members["user"].toClosureExpr())
      .toBe("{ name: string, age: number }");
  });

  it("parses structs with array properties", () => {
    const structWithArray = parseType("{users: {name: string, age: number}[]}");
    expect(structWithArray).toBeInstanceOf(StructType);
    expect(structWithArray.members["users"]).toBeInstanceOf(GenericType);
    const usersArray = /** @type {!GenericType} */(structWithArray.members["users"]);
    expect(usersArray.name).toBe("Array");
    expect(usersArray.params.length).toBe(1);
    expect(usersArray.params[0]).toBeInstanceOf(StructType);
    const userStruct = /** @type {!StructType} */(usersArray.params[0]);
    expect(userStruct.members["name"]).toBeInstanceOf(PrimitiveType);
    expect(userStruct.members["name"].name).toBe("string");
    expect(userStruct.members["age"]).toBeInstanceOf(PrimitiveType);
    expect(userStruct.members["age"].name).toBe("number");
  });

  it("parses {name$:string, age:number}", () => {
    const withDollarOptional = /** @type {!StructType} */ (
      parseType("{name$: string, age: number}"));
    expect(withDollarOptional).toBeInstanceOf(StructType);
    expect(withDollarOptional.members["name$"]).toBeInstanceOf(PrimitiveType);
    expect(withDollarOptional.members["name$"].name).toBe("string");
    expect(withDollarOptional.members["name$"].isOptional()).toBeTrue();
  });
});

describe("Functions", () => {
  test("basics", () => {
    const basicFn = parseType("() => void");
    expect(basicFn).toBeInstanceOf(FunctionType);
    expect(basicFn.params.length).toBe(0);
    expect(basicFn.returnType).toBeInstanceOf(PrimitiveType);
    expect(basicFn.returnType.name).toBe("undefined");
    expect(basicFn.optionalAfter).toBe(0);
  });

  test("whitespace", () => {
    const basicFn = parseType("( )=>void");
    expect(basicFn).toBeInstanceOf(FunctionType);
    expect(basicFn.params.length).toBe(0);
    expect(basicFn.returnType).toBeInstanceOf(PrimitiveType);
    expect(basicFn.returnType.name).toBe("undefined");
    expect(basicFn.optionalAfter).toBe(0);
  })

  it("parses (a:string,b:number)=>boolean", () => {
    const fnWithParams = parseType("(a: string, b: number) => boolean");
    expect(fnWithParams).toBeInstanceOf(FunctionType);
    expect(fnWithParams.params.length).toBe(2);
    expect(fnWithParams.params[0]).toBeInstanceOf(PrimitiveType);
    expect(fnWithParams.params[0].name).toBe("string");
    expect(fnWithParams.params[1]).toBeInstanceOf(PrimitiveType);
    expect(fnWithParams.params[1].name).toBe("number");
    expect(fnWithParams.optionalAfter).toBe(2); // No optional params
    expect(fnWithParams.returnType).toBeInstanceOf(PrimitiveType);
    expect(fnWithParams.returnType.name).toBe("boolean");
  });

  it("parses (name:string, age?:number) => boolean", () => {
    const fnWithOptionalParams = parseType("(name: string, age?: number) => boolean");
    expect(fnWithOptionalParams).toBeInstanceOf(FunctionType);
    expect(fnWithOptionalParams.params.length).toBe(2);
    expect(fnWithOptionalParams.optionalAfter).toBe(1); // Second parameter is optional
    expect(fnWithOptionalParams.params[1] instanceof PrimitiveType).toBe(true);
    expect(fnWithOptionalParams.params[1].isOptional()).toBeTrue();
  });

  it("parses (name:string, age:number=) => boolean", () => {
    const fn = parseType("(name: string, age: number=) => boolean");
    expect(fn).toBeInstanceOf(FunctionType);
    expect(fn.params.length).toBe(2);
    expect(fn.optionalAfter).toBe(1); // Second parameter is optional
    expect(fn.params[1] instanceof PrimitiveType).toBe(true);
    expect(fn.params[1].isOptional()).toBeTrue();
  });

  it("parses (this:Context, value:string) => void", () => {
    const fnWithThis = parseType("(this: Context, value: string) => void");
    expect(fnWithThis).toBeInstanceOf(FunctionType);
    expect(fnWithThis.params.length).toBe(1); // 'this' is not counted in params
    expect(fnWithThis.thisType).toBeInstanceOf(InstanceType);
    expect(fnWithThis.thisType.name).toBe("Context");
    expect(fnWithThis.isMethod()).toBe(true);
  });

  it("parses (callback:(error:Error=)=>void,options?:{timeout:number}) => Promise<string>", () => {
    const complexFn = parseType("(callback: (error: Error=) => void, options?: {timeout: number}) => Promise<string>");
    expect(complexFn).toBeInstanceOf(FunctionType);
    expect(complexFn.params.length).toBe(2);
    expect(complexFn.params[0]).toBeInstanceOf(FunctionType);

    const callbackType = /** @type {!FunctionType} */(complexFn.params[0]);
    expect(callbackType.params.length).toBe(1);
    expect(callbackType.params[0]).toBeInstanceOf(InstanceType);
    expect(callbackType.params[0].name).toBe("Error");
    expect(callbackType.params[0].isOptional()).toBeTrue();
    expect(callbackType.optionalAfter).toBe(0);

    expect(complexFn.optionalAfter).toBe(1); // Second parameter is optional
    expect(complexFn.returnType).toBeInstanceOf(GenericType);
    expect(complexFn.returnType.name).toBe("Promise");
  });
});

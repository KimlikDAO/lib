import { describe, expect, it, test } from "bun:test";
import { parseType, parseTypePrefix } from "../parser";
import {
  ConstructorType,
  FunctionType,
  GenericType,
  InstanceType,
  PrimitiveType,
  PrimitiveTypeName,
  StructType,
  TopType,
  TopTypeName,
  UnionType
} from "../types";

describe("Primitives, TopTypes and simple UnionTypes", () => {
  it("parses string", () => {
    const stringType = /** @type {PrimitiveType} */(parseType("string"));
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    expect(stringType.isNullable()).toBe(false);
  });

  it("parses ?string", () => {
    const nullableString = /** @type {PrimitiveType} */(parseType("?string"));
    expect(nullableString).toBeInstanceOf(PrimitiveType);
    expect(nullableString.name).toBe(PrimitiveTypeName.String);
    expect(nullableString.isNullable()).toBe(true);
  });

  it("parses null", () => {
    const nullType = /** @type {PrimitiveType} */(parseType("null"));
    expect(nullType).toBeInstanceOf(PrimitiveType);
    expect(nullType.name).toBe(PrimitiveTypeName.Null);
    expect(nullType.isNullable()).toBe(true);
  });

  it("parses void", () => {
    const voidType = /** @type {PrimitiveType} */(parseType("void"));
    expect(voidType).toBeInstanceOf(PrimitiveType);
    expect(voidType.name).toBe(PrimitiveTypeName.Undefined);
    expect(voidType.isNullable()).toBe(false);
  });

  it("parses any", () => {
    const anyType = /** @type {TopType} */(parseType("any"));
    expect(anyType).toBeInstanceOf(TopType);
    expect(anyType.name).toBe(TopTypeName.Any);
    expect(anyType.isNullable()).toBe(true);
    expect(anyType.isOptional()).toBe(true);
  });

  it("parses unknown", () => {
    const unknownType = /** @type {TopType} */(parseType("unknown"));
    expect(unknownType).toBeInstanceOf(TopType);
    expect(unknownType.name).toBe(TopTypeName.Unknown);
    expect(unknownType.isNullable()).toBe(true);
    expect(unknownType.isOptional()).toBe(true);
  });

  it("parses instance types", () => {
    const userType = /** @type {InstanceType} */(parseType("User"));
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
    expect(userType.isNullable()).toBe(false);

    const nullableUser = /** @type {InstanceType} */(parseType("?User"));
    expect(nullableUser).toBeInstanceOf(InstanceType);
    expect(nullableUser.name).toBe("User");
    expect(nullableUser.isNullable()).toBe(true);
  });

  it("parses explicit nullable string", () => {
    const nullableType = /** @type {PrimitiveType} */(parseType("string | null"));
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe(PrimitiveTypeName.String);
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses shorthand nullable string", () => {
    const nullableType = /** @type {PrimitiveType} */(parseType("?string"));
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe(PrimitiveTypeName.String);
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses scoped instance types", () => {
    const scopedType = /** @type {InstanceType} */(parseType("namespace.MyClass"));
    expect(scopedType).toBeInstanceOf(InstanceType);
    expect(scopedType.name).toBe("namespace.MyClass");
    expect(scopedType.isNullable()).toBe(false);
  });
});

describe("Unions", () => {
  it("parses null|string", () => {
    const nullableType = /** @type {PrimitiveType} */(parseType("null | string"));
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe(PrimitiveTypeName.String);
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses (string|number)", () => {
    const union = /** @type {UnionType} */(parseType("string | number"));
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    const stringType = /** @type {PrimitiveType} */(union.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = /** @type {PrimitiveType} */(union.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should parse (string|bigint|null|undefined)", () => {
    const nullableOptUnion = /** @type {UnionType} */(parseType("string | bigint | null | undefined"));
    expect(nullableOptUnion).toBeInstanceOf(UnionType);
    expect(nullableOptUnion.types.length).toBe(2);
    expect(nullableOptUnion.isNullable()).toBe(true);
    expect(nullableOptUnion.isOptional()).toBe(true);
  });
});

describe("Arrays", () => {
  it("parses array shorthand notation", () => {
    const stringArray = /** @type {GenericType} */(parseType("string[]"));
    expect(stringArray).toBeInstanceOf(GenericType);
    expect(stringArray.name).toBe("Array");
    expect(stringArray.params.length).toBe(1);
    const stringType = /** @type {PrimitiveType} */(stringArray.params[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
  });

  it("should parse User[]", () => {
    const userArray = /** @type {GenericType} */(parseType("User[]"));
    expect(userArray).toBeInstanceOf(GenericType);
    expect(userArray.name).toBe("Array");
    expect(userArray.params.length).toBe(1);
    const userType = /** @type {InstanceType} */(userArray.params[0]);
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
  });
  
  it("parses string[][]", () => {
    const nestedArray = /** @type {GenericType} */(parseType("string[][]"));
    expect(nestedArray).toBeInstanceOf(GenericType);
    expect(nestedArray.name).toBe("Array");
    expect(nestedArray.params.length).toBe(1);
    const nestedStringArray = /** @type {GenericType} */(nestedArray.params[0]);
    expect(nestedStringArray).toBeInstanceOf(GenericType);
    expect(nestedStringArray.name).toBe("Array");
    expect(nestedStringArray.params.length).toBe(1);
    const nestedStringType = /** @type {PrimitiveType} */(nestedStringArray.params[0]);
    expect(nestedStringType).toBeInstanceOf(PrimitiveType);
    expect(nestedStringType.name).toBe(PrimitiveTypeName.String);
  });

  it("parses (number|bigint)[]=", () => {
    const { type, paramOpt } = /** @type {{ type: GenericType, paramOpt: boolean }} */(
      parseTypePrefix("(number | bigint)[]="));
    expect(type).toBeInstanceOf(GenericType);
    expect(type.isOptional()).toBeTrue();
    expect(paramOpt).toBeTrue();
  });
})

describe("Unions and generics", () => {
  it("parses User|Map<string,number>|null", () => {
    const complexUnion = /** @type {UnionType} */(parseType("User | Map<string, number> | null"));
    expect(complexUnion).toBeInstanceOf(UnionType);
    expect(complexUnion.types.length).toBe(2);
    expect(complexUnion.isNullable()).toBe(true);
  });

  it("parses Map<string,number>", () => {
    const mapType = /** @type {GenericType} */(parseType("Map<string, number>"));
    expect(mapType).toBeInstanceOf(GenericType);
    expect(mapType.name).toBe("Map");
    expect(mapType.isNullable()).toBe(false);
    expect(mapType.params.length).toBe(2);
    const stringType = /** @type {PrimitiveType} */(mapType.params[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = /** @type {PrimitiveType} */(mapType.params[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should parse ?Map<string,number>", () => {
    const nullableMap = /** @type {GenericType} */(parseType("?Map<string, number>"));
    expect(nullableMap).toBeInstanceOf(GenericType);
    expect(nullableMap.isNullable()).toBe(true);
    expect(nullableMap.params.length).toBe(2);
  });

  it("should respect precedence of union types", () => {
    const union = /** @type {GenericType} */(parseType("(string | number)[]"));
    expect(union).toBeInstanceOf(GenericType);
    expect(union.name).toBe("Array");
    const innerUnion = /** @type {UnionType} */(union.params[0]);
    expect(innerUnion).toBeInstanceOf(UnionType);
    expect(innerUnion.types.length).toBe(2);
    const stringType = /** @type {PrimitiveType} */(innerUnion.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = /** @type {PrimitiveType} */(innerUnion.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should parse parenthesized types", () => {
    const parenthesized = /** @type {UnionType} */(parseType("(string | number)"));
    expect(parenthesized).toBeInstanceOf(UnionType);
    expect(parenthesized.types.length).toBe(2);

    const arrayOfUnion = /** @type {GenericType} */(parseType("(string | number)[]"));
    expect(arrayOfUnion).toBeInstanceOf(GenericType);
    expect(arrayOfUnion.name).toBe("Array");
    expect(arrayOfUnion.params[0]).toBeInstanceOf(UnionType);
  });

  it("should parse Array<Map<string, User[]> | number>", () => {
    const complex = /** @type {GenericType} */(parseType("Array<Map<string, User[]> | number>"));
    expect(complex).toBeInstanceOf(GenericType);
    expect(complex.name).toBe("Array");
    const union = /** @type {UnionType} */(complex.params[0]);
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    const mapType = /** @type {GenericType} */(union.types[0]);
    expect(mapType).toBeInstanceOf(GenericType);
    expect(mapType.name).toBe("Map");
    expect(mapType.params.length).toBe(2);
    const arrayType = /** @type {GenericType} */(mapType.params[1]);
    expect(arrayType).toBeInstanceOf(GenericType);
    expect(arrayType.name).toBe("Array");
    const numberType = /** @type {PrimitiveType} */(union.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should ignore extra spaces", () => {
    const withSpaces = /** @type {GenericType} */(parseType("Array < string | number >   | undefined"));
    expect(withSpaces).toBeInstanceOf(GenericType);
    expect(withSpaces.name).toBe("Array");
    expect(withSpaces.isOptional()).toBeTrue();

    const unionType = /** @type {UnionType} */(withSpaces.params[0]);
    expect(unionType).toBeInstanceOf(UnionType);
    const stringType = /** @type {PrimitiveType} */(unionType.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = /** @type {PrimitiveType} */(unionType.types[1]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });
});

describe("Structs", () => {
  it("parses {name:string, age:number}", () => {
    const simpleStruct = /** @type {StructType} */(parseType("{name: string, age: number}"));
    expect(simpleStruct).toBeInstanceOf(StructType);
    expect(Object.keys(simpleStruct.members).length).toBe(2);

    const nameType = /** @type {PrimitiveType} */(simpleStruct.members["name"]);
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    const ageType = /** @type {PrimitiveType} */(simpleStruct.members["age"]);
    expect(ageType).toBeInstanceOf(PrimitiveType);
    expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses {name?:string, age:number}", () => { 
      const optProp = /** @type {StructType} */(parseType("{name?: string, age: number}"));
      expect(optProp).toBeInstanceOf(StructType);
      const nameType = /** @type {PrimitiveType} */(optProp.members["name"]);
      expect(nameType).toBeInstanceOf(PrimitiveType);
      expect(nameType.name).toBe(PrimitiveTypeName.String);
      expect(nameType.isOptional()).toBeTrue();
      const ageType = /** @type {PrimitiveType} */(optProp.members["age"]);
      expect(ageType).toBeInstanceOf(PrimitiveType);
      expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses {name$:string, age:number}", () => {
    const dollarOpt = /** @type {StructType} */(parseType("{name$: string, age: number}"));
    expect(dollarOpt).toBeInstanceOf(StructType);
    const nameType = /** @type {PrimitiveType} */(dollarOpt.members["name$"]);
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    expect(nameType.isOptional()).toBeTrue();
    const ageType = /** @type {PrimitiveType} */(dollarOpt.members["age"]);
    expect(ageType).toBeInstanceOf(PrimitiveType);
    expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("handles nested structs", () => {
    const nestedStruct = /** @type {StructType} */(parseType("{user: {name: string, age: number}, active: boolean}"));
    expect(nestedStruct).toBeInstanceOf(StructType);
    expect(nestedStruct.members["user"]).toBeInstanceOf(StructType);
    expect(nestedStruct.members["active"]).toBeInstanceOf(PrimitiveType);
    expect(nestedStruct.members["user"].toClosureExpr())
      .toBe("{ name: string, age: number }");
  });

  it("parses structs with array properties", () => {
    const structWithArray = /** @type {StructType} */(parseType("{users: {name: string, age: number}[]}"));
    expect(structWithArray).toBeInstanceOf(StructType);
    expect(structWithArray.members["users"]).toBeInstanceOf(GenericType);
    const usersArray = /** @type {GenericType} */(structWithArray.members["users"]);
    expect(usersArray.name).toBe("Array");
    expect(usersArray.params.length).toBe(1);
    const struct = /** @type {StructType} */(usersArray.params[0]);
    expect(struct).toBeInstanceOf(StructType);
    const nameType = /** @type {PrimitiveType} */(struct.members["name"]);
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    const ageType = /** @type {PrimitiveType} */(struct.members["age"]);
    expect(ageType).toBeInstanceOf(PrimitiveType);
    expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses {name$:string, age:number}", () => {
    const withDollarOptional = /** @type {StructType} */ (
      parseType("{name$: string, age: number}"));
    expect(withDollarOptional).toBeInstanceOf(StructType);
    const name = /** @type {PrimitiveType} */(withDollarOptional.members["name$"]);
    expect(name).toBeInstanceOf(PrimitiveType);
    expect(name.name).toBe(PrimitiveTypeName.String);
    expect(name.isOptional()).toBeTrue();
    const age = /** @type {PrimitiveType} */(withDollarOptional.members["age"]);
    expect(age).toBeInstanceOf(PrimitiveType);
    expect(age.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses multi-line structs", () => {
    const struct = /** @type {StructType} */(parseType(`{
      name: string,
      age: number
    }`));
    expect(struct).toBeInstanceOf(StructType);
    const name = /** @type {PrimitiveType} */(struct.members["name"]);
    expect(name).toBeInstanceOf(PrimitiveType);
    expect(name.name).toBe(PrimitiveTypeName.String);
    const age = /** @type {PrimitiveType} */(struct.members["age"]);
    expect(age).toBeInstanceOf(PrimitiveType);
    expect(age.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses with trailing comma", () => {
    const struct = /** @type {StructType} */(parseType("{name: string, age: number,}"));
    expect(struct).toBeInstanceOf(StructType);
    expect(struct.members["name"]).toBeInstanceOf(PrimitiveType);
    expect(struct.members["name"].name).toBe(PrimitiveTypeName.String);
    expect(struct.members["age"]).toBeInstanceOf(PrimitiveType);
    expect(struct.members["age"].name).toBe(PrimitiveTypeName.Number);
  });

  it("parses multi-line complex structs", () => {
    const complexStruct = /** @type {StructType} */(parseType(`{
     *   promise: () => Promise<unknown>,
     *   resolve: (val: unknown) => void,
     *   reject: (err: unknown) => void
     * }}
     */}`));

    expect(complexStruct).toBeInstanceOf(StructType);
    const promiseType = /** @type {FunctionType} */(complexStruct.members["promise"]);
    expect(promiseType).toBeInstanceOf(FunctionType);
    const promiseReturn = /** @type {GenericType} */(promiseType.returnType);
    expect(promiseReturn).toBeInstanceOf(GenericType);
    expect(promiseReturn.name).toBe("Promise");
    expect(promiseReturn.params.length).toBe(1);
    const unknownType = /** @type {TopType} */(promiseReturn.params[0]);
    expect(unknownType).toBeInstanceOf(TopType);
    expect(unknownType.name).toBe(TopTypeName.Unknown);

    const resolveType = /** @type {FunctionType} */(complexStruct.members["resolve"]);
    expect(resolveType).toBeInstanceOf(FunctionType);
    expect(resolveType.params.length).toBe(1);
    const resolveParam = /** @type {TopType} */(resolveType.params[0]);
    expect(resolveParam).toBeInstanceOf(TopType);
    expect(resolveParam.name).toBe(TopTypeName.Unknown);
    const resolveReturn = /** @type {PrimitiveType} */(resolveType.returnType);
    expect(resolveReturn).toBeInstanceOf(PrimitiveType);
    expect(resolveReturn.name).toBe(PrimitiveTypeName.Undefined);

    const rejectType = /** @type {FunctionType} */(complexStruct.members["reject"]);
    expect(rejectType).toBeInstanceOf(FunctionType);
    expect(rejectType.params.length).toBe(1);
    const rejectParam = /** @type {TopType} */(rejectType.params[0]);
    expect(rejectParam).toBeInstanceOf(TopType);
    expect(rejectParam.name).toBe(TopTypeName.Unknown);
    const rejectReturn = /** @type {PrimitiveType} */(rejectType.returnType);
    expect(rejectReturn).toBeInstanceOf(PrimitiveType);
    expect(rejectReturn.name).toBe(PrimitiveTypeName.Undefined);
  });
});

describe("Functions", () => {
  test("basics", () => {
    const basicFn = /** @type {FunctionType} */(parseType("() => void"));
    expect(basicFn).toBeInstanceOf(FunctionType);
    expect(basicFn.params.length).toBe(0);
    expect(basicFn.optionalAfter).toBe(0);

    const returnType = /** @type {PrimitiveType} */(basicFn.returnType);
    expect(returnType).toBeInstanceOf(PrimitiveType);
    expect(returnType.name).toBe(PrimitiveTypeName.Undefined);
  });

  test("whitespace", () => {
    const basicFn = /** @type {FunctionType} */(parseType("( )=>void"));
    expect(basicFn).toBeInstanceOf(FunctionType);
    expect(basicFn.params.length).toBe(0);
    expect(basicFn.optionalAfter).toBe(0);

    const returnType = /** @type {PrimitiveType} */(basicFn.returnType);
    expect(returnType).toBeInstanceOf(PrimitiveType);
    expect(returnType.name).toBe(PrimitiveTypeName.Undefined);
  })

  it("parses (a:string,b:number)=>boolean", () => {
    const fnWithParams = /** @type {FunctionType} */(parseType("(a: string, b: number) => boolean"));
    expect(fnWithParams).toBeInstanceOf(FunctionType);
    expect(fnWithParams.params.length).toBe(2);
    const aType = /** @type {PrimitiveType} */(fnWithParams.params[0]);
    expect(aType).toBeInstanceOf(PrimitiveType);
    expect(aType.name).toBe(PrimitiveTypeName.String);
    const bType = /** @type {PrimitiveType} */(fnWithParams.params[1]);
    expect(bType).toBeInstanceOf(PrimitiveType);
    expect(bType.name).toBe(PrimitiveTypeName.Number);
    expect(fnWithParams.optionalAfter).toBe(2); // No optional params
    const returnType = /** @type {PrimitiveType} */(fnWithParams.returnType);
    expect(returnType).toBeInstanceOf(PrimitiveType);
    expect(returnType.name).toBe(PrimitiveTypeName.Boolean);
  });

  it("parses (name:string, age?:number) => boolean", () => {
    const fnWithOptionalParams = /** @type {FunctionType} */(parseType(
      "(name: string, age?: number) => boolean"));
    expect(fnWithOptionalParams).toBeInstanceOf(FunctionType);
    expect(fnWithOptionalParams.params.length).toBe(2);
    expect(fnWithOptionalParams.optionalAfter).toBe(1); // Second parameter is optional
    expect(fnWithOptionalParams.params[1] instanceof PrimitiveType).toBe(true);
    expect(fnWithOptionalParams.params[1].isOptional()).toBeTrue();
  });

  it("parses (name:string, age:number=) => boolean", () => {
    const fn = /** @type {FunctionType} */(parseType("(name: string, age: number=) => boolean"));
    expect(fn).toBeInstanceOf(FunctionType);
    expect(fn.params.length).toBe(2);
    expect(fn.optionalAfter).toBe(1); // Second parameter is optional
    expect(fn.params[1] instanceof PrimitiveType).toBe(true);
    expect(fn.params[1].isOptional()).toBeTrue();
  });

  it("parses (this:Context, value:string) => void", () => {
    const fnWithThis = /** @type {FunctionType} */(parseType("(this: Context, value: string) => void"));
    expect(fnWithThis).toBeInstanceOf(FunctionType);
    expect(fnWithThis.params.length).toBe(1); // 'this' is not counted in params
    expect(fnWithThis.isMethod()).toBe(true);
    const thisType = /** @type {InstanceType} */(fnWithThis.thisType);
    expect(thisType).toBeInstanceOf(InstanceType);
    expect(thisType.name).toBe("Context");
  });

  it("parses (callback:(error:Error=)=>void,options?:{timeout:number}) => Promise<string>", () => {
    const complexFn = /** @type {FunctionType} */(
      parseType("(callback: (error: Error=) => void, options?: {timeout: number}) => Promise<string>"));
    expect(complexFn).toBeInstanceOf(FunctionType);
    expect(complexFn.params.length).toBe(2);

    const callbackType = /** @type {FunctionType} */(complexFn.params[0]);
    expect(callbackType).toBeInstanceOf(FunctionType);
    expect(callbackType.params.length).toBe(1);
    expect(callbackType.optionalAfter).toBe(0);
    const callbackParam = /** @type {InstanceType} */(callbackType.params[0]);
    expect(callbackParam).toBeInstanceOf(InstanceType);
    expect(callbackParam.name).toBe("Error");
    expect(callbackParam.isOptional()).toBeTrue();

    expect(complexFn.optionalAfter).toBe(1); // Second parameter is optional
    const returnType = /** @type {GenericType} */(complexFn.returnType);
    expect(returnType).toBeInstanceOf(GenericType);
    expect(returnType.name).toBe("Promise");
    expect(returnType.params.length).toBe(1);
  });

  it("parses (...a: bigint[]) => void", () => {
    const fn = /** @type {FunctionType} */(parseType("(...a: bigint[]) => void"));
    expect(fn).toBeInstanceOf(FunctionType);
    expect(fn.params.length).toBe(1);
    const biType = /** @type {PrimitiveType} */(fn.params[0]);
    expect(biType).toBeInstanceOf(PrimitiveType);
    expect(biType.name).toBe(PrimitiveTypeName.BigInt);
    expect(fn.rest).toBeTrue();
  });

  it("parses @param {...bigint}", () => {
    const { type, paramRest } = parseTypePrefix("...bigint");
    expect(type).toBeInstanceOf(PrimitiveType);
    expect(type.name).toBe(PrimitiveTypeName.BigInt);
    expect(paramRest).toBeTrue();
  })
});

describe("Constructors", () => {
  it("parses new () => User", () => {
    const constructor = /** @type {ConstructorType} */(parseType("new () => User"));
    expect(constructor).toBeInstanceOf(ConstructorType);
    expect(constructor.params.length).toBe(0);
    const thisType = /** @type {InstanceType} */(constructor.thisType);
    expect(thisType).toBeInstanceOf(InstanceType);
    expect(thisType.name).toBe("User");
  });

  it("parses new (name?:string) => User", () => {
    const constructorWithParams = /** @type {ConstructorType} */(parseType(
      "new (name?: string) => User"));
    expect(constructorWithParams).toBeInstanceOf(ConstructorType);
    expect(constructorWithParams.params.length).toBe(1);
    expect(constructorWithParams.optionalAfter).toBe(0);
    const nameType = /** @type {PrimitiveType} */(constructorWithParams.params[0]);
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    expect(nameType.isOptional()).toBeTrue();

    const thisType = /** @type {InstanceType} */(constructorWithParams.thisType);
    expect(thisType).toBeInstanceOf(InstanceType);
    expect(thisType.name).toBe("User");
  });
});

describe("Precedence and associativity", () => {
  test("() => number | bigint", () => {
    const fn = /** @type {FunctionType} */(parseType("() => number | bigint"));
    expect(fn).toBeInstanceOf(FunctionType);
    const returnType = /** @type {UnionType} */(fn.returnType);
    expect(returnType).toBeInstanceOf(UnionType);
    expect(returnType.types.length).toBe(2);
    const numberType = /** @type {PrimitiveType} */(returnType.types[0]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
    const bigintType = /** @type {PrimitiveType} */(returnType.types[1]);
    expect(bigintType).toBeInstanceOf(PrimitiveType);
    expect(bigintType.name).toBe(PrimitiveTypeName.BigInt);
  });

  test("(()=>void) | ()=>Promise<void>", () => {
    const union = /** @type {UnionType} */(parseType("(() => void) | (() => Promise<void>)"));
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    expect(union.types[0]).toBeInstanceOf(FunctionType);
    expect(union.types[1]).toBeInstanceOf(FunctionType);
  });

  test("string | number[] - array suffix binds tighter than union", () => {
    const type = /** @type {UnionType} */(parseType("string | number[]"));
    expect(type).toBeInstanceOf(UnionType);
    expect(type.types.length).toBe(2);
    const stringType = /** @type {PrimitiveType} */(type.types[0]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const arrayType = /** @type {GenericType} */(type.types[1]);
    expect(arrayType).toBeInstanceOf(GenericType);
    expect(arrayType.name).toBe("Array");
    expect(arrayType.params.length).toBe(1);
    const numberType = /** @type {PrimitiveType} */(arrayType.params[0]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  test("() => () => number | string", () => {
    const type = /** @type {FunctionType} */(parseType("() => () => number | string"));
    expect(type).toBeInstanceOf(FunctionType);
    expect(type.params.length).toBe(0);
    expect(type.returnType).toBeInstanceOf(FunctionType);
    const innerFn = /** @type {FunctionType} */(type.returnType);
    expect(innerFn.params.length).toBe(0);
    expect(innerFn.returnType).toBeInstanceOf(UnionType);
    const returnUnion = /** @type {UnionType} */(innerFn.returnType);
    expect(returnUnion.types.length).toBe(2);
    const numberType = /** @type {PrimitiveType} */(returnUnion.types[0]);
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
    const stringType = /** @type {PrimitiveType} */(returnUnion.types[1]);
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
  });
});

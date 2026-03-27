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
    const stringType = parseType("string") as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    expect(stringType.isNullable()).toBe(false);
  });

  it("parses ?string", () => {
    const nullableString = parseType("?string") as PrimitiveType;
    expect(nullableString).toBeInstanceOf(PrimitiveType);
    expect(nullableString.name).toBe(PrimitiveTypeName.String);
    expect(nullableString.isNullable()).toBe(true);
  });

  it("parses null", () => {
    const nullType = parseType("null") as PrimitiveType;
    expect(nullType).toBeInstanceOf(PrimitiveType);
    expect(nullType.name).toBe(PrimitiveTypeName.Null);
    expect(nullType.isNullable()).toBe(true);
  });

  it("parses void", () => {
    const voidType = parseType("void") as PrimitiveType;
    expect(voidType).toBeInstanceOf(PrimitiveType);
    expect(voidType.name).toBe(PrimitiveTypeName.Undefined);
    expect(voidType.isNullable()).toBe(false);
  });

  it("parses any", () => {
    const anyType = parseType("any") as TopType;
    expect(anyType).toBeInstanceOf(TopType);
    expect(anyType.name).toBe(TopTypeName.Any);
    expect(anyType.isNullable()).toBe(true);
    expect(anyType.isOptional()).toBe(true);
  });

  it("parses unknown", () => {
    const unknownType = parseType("unknown") as TopType;
    expect(unknownType).toBeInstanceOf(TopType);
    expect(unknownType.name).toBe(TopTypeName.Unknown);
    expect(unknownType.isNullable()).toBe(true);
    expect(unknownType.isOptional()).toBe(true);
  });

  it("parses instance types", () => {
    const userType = parseType("User") as InstanceType;
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
    expect(userType.isNullable()).toBe(false);

    const nullableUser = parseType("?User") as InstanceType;
    expect(nullableUser).toBeInstanceOf(InstanceType);
    expect(nullableUser.name).toBe("User");
    expect(nullableUser.isNullable()).toBe(true);
  });

  it("parses explicit nullable string", () => {
    const nullableType = parseType("string | null") as PrimitiveType;
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe(PrimitiveTypeName.String);
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses shorthand nullable string", () => {
    const nullableType = parseType("?string") as PrimitiveType;
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe(PrimitiveTypeName.String);
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses scoped instance types", () => {
    const scopedType = parseType("namespace.MyClass") as InstanceType;
    expect(scopedType).toBeInstanceOf(InstanceType);
    expect(scopedType.name).toBe("namespace.MyClass");
    expect(scopedType.isNullable()).toBe(false);
  });
});

describe("Unions", () => {
  it("parses null|string", () => {
    const nullableType = parseType("null | string") as PrimitiveType;
    expect(nullableType).toBeInstanceOf(PrimitiveType);
    expect(nullableType.name).toBe(PrimitiveTypeName.String);
    expect(nullableType.isNullable()).toBe(true);
  });

  it("parses (string|number)", () => {
    const union = parseType("string | number") as UnionType;
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    const stringType = union.types[0] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = union.types[1] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should parse (string|bigint|null|undefined)", () => {
    const nullableOptUnion = parseType("string | bigint | null | undefined") as UnionType;
    expect(nullableOptUnion).toBeInstanceOf(UnionType);
    expect(nullableOptUnion.types.length).toBe(2);
    expect(nullableOptUnion.isNullable()).toBe(true);
    expect(nullableOptUnion.isOptional()).toBe(true);
  });
});

describe("Arrays", () => {
  it("parses array shorthand notation", () => {
    const stringArray = parseType("string[]") as GenericType;
    expect(stringArray).toBeInstanceOf(GenericType);
    expect(stringArray.name).toBe("Array");
    expect(stringArray.params.length).toBe(1);
    const stringType = stringArray.params[0] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
  });

  it("should parse User[]", () => {
    const userArray = parseType("User[]") as GenericType;
    expect(userArray).toBeInstanceOf(GenericType);
    expect(userArray.name).toBe("Array");
    expect(userArray.params.length).toBe(1);
    const userType = userArray.params[0] as InstanceType;
    expect(userType).toBeInstanceOf(InstanceType);
    expect(userType.name).toBe("User");
  });
  
  it("parses string[][]", () => {
    const nestedArray = parseType("string[][]") as GenericType;
    expect(nestedArray).toBeInstanceOf(GenericType);
    expect(nestedArray.name).toBe("Array");
    expect(nestedArray.params.length).toBe(1);
    const nestedStringArray = nestedArray.params[0] as GenericType;
    expect(nestedStringArray).toBeInstanceOf(GenericType);
    expect(nestedStringArray.name).toBe("Array");
    expect(nestedStringArray.params.length).toBe(1);
    const nestedStringType = nestedStringArray.params[0] as PrimitiveType;
    expect(nestedStringType).toBeInstanceOf(PrimitiveType);
    expect(nestedStringType.name).toBe(PrimitiveTypeName.String);
  });

  it("parses (number|bigint)[]=", () => {
    const { type, paramOpt } = parseTypePrefix("(number | bigint)[]=");
    expect(type).toBeInstanceOf(GenericType);
    expect(type.isOptional()).toBeTrue();
    expect(paramOpt).toBeTrue();
  });

  it("parses readonly Type[] as ReadonlyArray", () => {
    const ro = parseType("readonly number[]") as GenericType;
    expect(ro).toBeInstanceOf(GenericType);
    expect(ro.name).toBe("ReadonlyArray");
    expect(ro.params.length).toBe(1);
    expect((ro.params[0] as PrimitiveType).name).toBe(PrimitiveTypeName.Number);
  });

  it("parses readonly (readonly T[])[] as nested ReadonlyArray", () => {
    const ro = parseType("readonly (readonly bigint[])[]") as GenericType;
    expect(ro).toBeInstanceOf(GenericType);
    expect(ro.name).toBe("ReadonlyArray");
    expect(ro.params.length).toBe(1);
    const inner = ro.params[0] as GenericType;
    expect(inner.name).toBe("ReadonlyArray");
    expect((inner.params[0] as PrimitiveType).name).toBe(PrimitiveTypeName.BigInt);
  });

  it("parses readonly bigint[][]", () => {
    const ro = parseType("readonly bigint[][]") as GenericType;
    expect(ro).toBeInstanceOf(GenericType);
    expect(ro.name).toBe("Array");
    expect(ro.params.length).toBe(1);
    const inner = ro.params[0] as GenericType;
    expect(inner.name).toBe("ReadonlyArray");
    expect((inner.params[0] as PrimitiveType).name)
      .toBe(PrimitiveTypeName.BigInt);
  });
})

describe("Unions and generics", () => {
  it("parses User|Map<string,number>|null", () => {
    const complexUnion = parseType("User | Map<string, number> | null") as UnionType;
    expect(complexUnion).toBeInstanceOf(UnionType);
    expect(complexUnion.types.length).toBe(2);
    expect(complexUnion.isNullable()).toBe(true);
  });

  it("parses Map<string,number>", () => {
    const mapType = parseType("Map<string, number>") as GenericType;
    expect(mapType).toBeInstanceOf(GenericType);
    expect(mapType.name).toBe("Map");
    expect(mapType.isNullable()).toBe(false);
    expect(mapType.params.length).toBe(2);
    const stringType = mapType.params[0] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = mapType.params[1] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should parse ?Map<string,number>", () => {
    const nullableMap = parseType("?Map<string, number>") as GenericType;
    expect(nullableMap).toBeInstanceOf(GenericType);
    expect(nullableMap.isNullable()).toBe(true);
    expect(nullableMap.params.length).toBe(2);
  });

  it("should respect precedence of union types", () => {
    const union = parseType("(string | number)[]") as GenericType;
    expect(union).toBeInstanceOf(GenericType);
    expect(union.name).toBe("Array");
    const innerUnion = union.params[0] as UnionType;
    expect(innerUnion).toBeInstanceOf(UnionType);
    expect(innerUnion.types.length).toBe(2);
    const stringType = innerUnion.types[0] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = innerUnion.types[1] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should parse parenthesized types", () => {
    const parenthesized = parseType("(string | number)") as UnionType;
    expect(parenthesized).toBeInstanceOf(UnionType);
    expect(parenthesized.types.length).toBe(2);

    const arrayOfUnion = parseType("(string | number)[]") as GenericType;
    expect(arrayOfUnion).toBeInstanceOf(GenericType);
    expect(arrayOfUnion.name).toBe("Array");
    expect(arrayOfUnion.params[0]).toBeInstanceOf(UnionType);
  });

  it("should parse Array<Map<string, User[]> | number>", () => {
    const complex = parseType("Array<Map<string, User[]> | number>") as GenericType;
    expect(complex).toBeInstanceOf(GenericType);
    expect(complex.name).toBe("Array");
    const union = complex.params[0] as UnionType;
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    const mapType = union.types[0] as GenericType;
    expect(mapType).toBeInstanceOf(GenericType);
    expect(mapType.name).toBe("Map");
    expect(mapType.params.length).toBe(2);
    const arrayType = mapType.params[1] as GenericType;
    expect(arrayType).toBeInstanceOf(GenericType);
    expect(arrayType.name).toBe("Array");
    const numberType = union.types[1] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  it("should ignore extra spaces", () => {
    const withSpaces = parseType("Array < string | number >   | undefined") as GenericType;
    expect(withSpaces).toBeInstanceOf(GenericType);
    expect(withSpaces.name).toBe("Array");
    expect(withSpaces.isOptional()).toBeTrue();

    const unionType = withSpaces.params[0] as UnionType;
    expect(unionType).toBeInstanceOf(UnionType);
    const stringType = unionType.types[0] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const numberType = unionType.types[1] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });
});

describe("Structs", () => {
  it("parses {name:string, age:number}", () => {
    const simpleStruct = parseType("{name: string, age: number}") as StructType;
    expect(simpleStruct).toBeInstanceOf(StructType);
    expect(Object.keys(simpleStruct.members).length).toBe(2);

    const nameType = simpleStruct.members["name"] as PrimitiveType;
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    const ageType = simpleStruct.members["age"] as PrimitiveType;
    expect(ageType).toBeInstanceOf(PrimitiveType);
    expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses {name?:string, age:number}", () => { 
      const optProp = parseType("{name?: string, age: number}") as StructType;
      expect(optProp).toBeInstanceOf(StructType);
      const nameType = optProp.members["name"] as PrimitiveType;
      expect(nameType).toBeInstanceOf(PrimitiveType);
      expect(nameType.name).toBe(PrimitiveTypeName.String);
      expect(nameType.isOptional()).toBeTrue();
      const ageType = optProp.members["age"] as PrimitiveType;
      expect(ageType).toBeInstanceOf(PrimitiveType);
      expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses {name$:string, age:number}", () => {
    const dollarOpt = parseType("{name$: string, age: number}") as StructType;
    expect(dollarOpt).toBeInstanceOf(StructType);
    const nameType = dollarOpt.members["name$"] as PrimitiveType;
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    expect(nameType.isOptional()).toBeTrue();
    const ageType = dollarOpt.members["age"] as PrimitiveType;
    expect(ageType).toBeInstanceOf(PrimitiveType);
    expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("handles nested structs", () => {
    const nestedStruct = parseType("{user: {name: string, age: number}, active: boolean}") as StructType;
    expect(nestedStruct).toBeInstanceOf(StructType);
    expect(nestedStruct.members["user"]).toBeInstanceOf(StructType);
    expect(nestedStruct.members["active"]).toBeInstanceOf(PrimitiveType);
    expect(nestedStruct.members["user"].toClosureExpr())
      .toBe("{ name: string, age: number }");
  });

  it("parses structs with array properties", () => {
    const structWithArray = parseType("{users: {name: string, age: number}[]}") as StructType;
    expect(structWithArray).toBeInstanceOf(StructType);
    expect(structWithArray.members["users"]).toBeInstanceOf(GenericType);
    const usersArray = structWithArray.members["users"] as GenericType;
    expect(usersArray.name).toBe("Array");
    expect(usersArray.params.length).toBe(1);
    const struct = usersArray.params[0] as StructType;
    expect(struct).toBeInstanceOf(StructType);
    const nameType = struct.members["name"] as PrimitiveType;
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    const ageType = struct.members["age"] as PrimitiveType;
    expect(ageType).toBeInstanceOf(PrimitiveType);
    expect(ageType.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses {name$:string, age:number}", () => {
    const withDollarOptional =
      parseType("{name$: string, age: number}") as StructType;
    expect(withDollarOptional).toBeInstanceOf(StructType);
    const name = withDollarOptional.members["name$"] as PrimitiveType;
    expect(name).toBeInstanceOf(PrimitiveType);
    expect(name.name).toBe(PrimitiveTypeName.String);
    expect(name.isOptional()).toBeTrue();
    const age = withDollarOptional.members["age"] as PrimitiveType;
    expect(age).toBeInstanceOf(PrimitiveType);
    expect(age.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses multi-line structs", () => {
    const struct = parseType(`{
      name: string,
      age: number
    }`) as StructType;
    expect(struct).toBeInstanceOf(StructType);
    const name = struct.members["name"] as PrimitiveType;
    expect(name).toBeInstanceOf(PrimitiveType);
    expect(name.name).toBe(PrimitiveTypeName.String);
    const age = struct.members["age"] as PrimitiveType;
    expect(age).toBeInstanceOf(PrimitiveType);
    expect(age.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses with trailing comma", () => {
    const struct = parseType("{name: string, age: number,}") as StructType;
    expect(struct).toBeInstanceOf(StructType);
    const name = struct.members["name"] as PrimitiveType;
    expect(name).toBeInstanceOf(PrimitiveType);
    expect(name.name).toBe(PrimitiveTypeName.String);
    const age = struct.members["age"] as PrimitiveType;
    expect(age).toBeInstanceOf(PrimitiveType);
    expect(age.name).toBe(PrimitiveTypeName.Number);
  });

  it("parses multi-line complex structs", () => {
    const complexStruct = parseType(`{
     *   promise: () => Promise<unknown>,
     *   resolve: (val: unknown) => void,
     *   reject: (err: unknown) => void
     * }}
     */}`) as StructType;

    expect(complexStruct).toBeInstanceOf(StructType);
    const promiseType = complexStruct.members["promise"] as FunctionType;
    expect(promiseType).toBeInstanceOf(FunctionType);
    const promiseReturn = promiseType.returnType as GenericType;
    expect(promiseReturn).toBeInstanceOf(GenericType);
    expect(promiseReturn.name).toBe("Promise");
    expect(promiseReturn.params.length).toBe(1);
    const unknownType = promiseReturn.params[0] as TopType;
    expect(unknownType).toBeInstanceOf(TopType);
    expect(unknownType.name).toBe(TopTypeName.Unknown);

    const resolveType = complexStruct.members["resolve"] as FunctionType;
    expect(resolveType).toBeInstanceOf(FunctionType);
    expect(resolveType.params.length).toBe(1);
    const resolveParam = resolveType.params[0] as TopType;
    expect(resolveParam).toBeInstanceOf(TopType);
    expect(resolveParam.name).toBe(TopTypeName.Unknown);
    const resolveReturn = resolveType.returnType as PrimitiveType;
    expect(resolveReturn).toBeInstanceOf(PrimitiveType);
    expect(resolveReturn.name).toBe(PrimitiveTypeName.Undefined);

    const rejectType = complexStruct.members["reject"] as FunctionType;
    expect(rejectType).toBeInstanceOf(FunctionType);
    expect(rejectType.params.length).toBe(1);
    const rejectParam = rejectType.params[0] as TopType;
    expect(rejectParam).toBeInstanceOf(TopType);
    expect(rejectParam.name).toBe(TopTypeName.Unknown);
    const rejectReturn = rejectType.returnType as PrimitiveType;
    expect(rejectReturn).toBeInstanceOf(PrimitiveType);
    expect(rejectReturn.name).toBe(PrimitiveTypeName.Undefined);
  });
});

describe("Functions", () => {
  test("basics", () => {
    const basicFn = parseType("() => void") as FunctionType;
    expect(basicFn).toBeInstanceOf(FunctionType);
    expect(basicFn.params.length).toBe(0);
    expect(basicFn.optionalAfter).toBe(0);

    const returnType = basicFn.returnType as PrimitiveType;
    expect(returnType).toBeInstanceOf(PrimitiveType);
    expect(returnType.name).toBe(PrimitiveTypeName.Undefined);
  });

  test("whitespace", () => {
    const basicFn = parseType("( )=>void") as FunctionType;
    expect(basicFn).toBeInstanceOf(FunctionType);
    expect(basicFn.params.length).toBe(0);
    expect(basicFn.optionalAfter).toBe(0);

    const returnType = basicFn.returnType as PrimitiveType;
    expect(returnType).toBeInstanceOf(PrimitiveType);
    expect(returnType.name).toBe(PrimitiveTypeName.Undefined);
  })

  it("parses (a:string,b:number)=>boolean", () => {
    const fnWithParams = parseType("(a: string, b: number) => boolean") as FunctionType;
    expect(fnWithParams).toBeInstanceOf(FunctionType);
    expect(fnWithParams.params.length).toBe(2);
    const aType = fnWithParams.params[0] as PrimitiveType;
    expect(aType).toBeInstanceOf(PrimitiveType);
    expect(aType.name).toBe(PrimitiveTypeName.String);
    const bType = fnWithParams.params[1] as PrimitiveType;
    expect(bType).toBeInstanceOf(PrimitiveType);
    expect(bType.name).toBe(PrimitiveTypeName.Number);
    expect(fnWithParams.optionalAfter).toBe(2); // No optional params
    const returnType = fnWithParams.returnType as PrimitiveType;
    expect(returnType).toBeInstanceOf(PrimitiveType);
    expect(returnType.name).toBe(PrimitiveTypeName.Boolean);
  });

  it("parses (name:string, age?:number) => boolean", () => {
    const fnWithOptionalParams = parseType(
      "(name: string, age?: number) => boolean") as FunctionType;
    expect(fnWithOptionalParams).toBeInstanceOf(FunctionType);
    expect(fnWithOptionalParams.params.length).toBe(2);
    expect(fnWithOptionalParams.optionalAfter).toBe(1); // Second parameter is optional
    expect(fnWithOptionalParams.params[1] instanceof PrimitiveType).toBe(true);
    expect(fnWithOptionalParams.params[1].isOptional()).toBeTrue();
  });

  it("parses (name:string, age:number=) => boolean", () => {
    const fn = parseType("(name: string, age: number=) => boolean") as FunctionType;
    expect(fn).toBeInstanceOf(FunctionType);
    expect(fn.params.length).toBe(2);
    expect(fn.optionalAfter).toBe(1); // Second parameter is optional
    expect(fn.params[1] instanceof PrimitiveType).toBe(true);
    expect(fn.params[1].isOptional()).toBeTrue();
  });

  it("parses (this:Context, value:string) => void", () => {
    const fnWithThis = parseType("(this: Context, value: string) => void") as FunctionType;
    expect(fnWithThis).toBeInstanceOf(FunctionType);
    expect(fnWithThis.params.length).toBe(1); // 'this' is not counted in params
    expect(fnWithThis.isMethod()).toBe(true);
    const thisType = fnWithThis.thisType as InstanceType;
    expect(thisType).toBeInstanceOf(InstanceType);
    expect(thisType.name).toBe("Context");
  });

  it("parses (callback:(error:Error=)=>void,options?:{timeout:number}) => Promise<string>", () => {
    const complexFn =
      parseType("(callback: (error: Error=) => void, options?: {timeout: number}) => Promise<string>") as FunctionType;
    expect(complexFn).toBeInstanceOf(FunctionType);
    expect(complexFn.params.length).toBe(2);

    const callbackType = complexFn.params[0] as FunctionType;
    expect(callbackType).toBeInstanceOf(FunctionType);
    expect(callbackType.params.length).toBe(1);
    expect(callbackType.optionalAfter).toBe(0);
    const callbackParam = callbackType.params[0] as InstanceType;
    expect(callbackParam).toBeInstanceOf(InstanceType);
    expect(callbackParam.name).toBe("Error");
    expect(callbackParam.isOptional()).toBeTrue();

    expect(complexFn.optionalAfter).toBe(1); // Second parameter is optional
    const returnType = complexFn.returnType as GenericType;
    expect(returnType).toBeInstanceOf(GenericType);
    expect(returnType.name).toBe("Promise");
    expect(returnType.params.length).toBe(1);
  });

  it("parses (...a: bigint[]) => void", () => {
    const fn = parseType("(...a: bigint[]) => void") as FunctionType;
    expect(fn).toBeInstanceOf(FunctionType);
    expect(fn.params.length).toBe(1);
    const biType = fn.params[0] as PrimitiveType;
    expect(biType).toBeInstanceOf(PrimitiveType);
    expect(biType.name).toBe(PrimitiveTypeName.BigInt);
    expect(fn.rest).toBeTrue();
  });

  it("parses @param {...bigint}", () => {
    const { type, paramRest } = parseTypePrefix("...bigint");
    const primitive = type as PrimitiveType;
    expect(primitive).toBeInstanceOf(PrimitiveType);
    expect(primitive.name).toBe(PrimitiveTypeName.BigInt);
    expect(paramRest).toBeTrue();
  })
});

describe("Constructors", () => {
  it("parses new () => User", () => {
    const constructor = parseType("new () => User") as ConstructorType;
    expect(constructor).toBeInstanceOf(ConstructorType);
    expect(constructor.params.length).toBe(0);
    const thisType = constructor.thisType as InstanceType;
    expect(thisType).toBeInstanceOf(InstanceType);
    expect(thisType.name).toBe("User");
  });

  it("parses new (name?:string) => User", () => {
    const constructorWithParams = parseType(
      "new (name?: string) => User") as ConstructorType;
    expect(constructorWithParams).toBeInstanceOf(ConstructorType);
    expect(constructorWithParams.params.length).toBe(1);
    expect(constructorWithParams.optionalAfter).toBe(0);
    const nameType = constructorWithParams.params[0] as PrimitiveType;
    expect(nameType).toBeInstanceOf(PrimitiveType);
    expect(nameType.name).toBe(PrimitiveTypeName.String);
    expect(nameType.isOptional()).toBeTrue();

    const thisType = constructorWithParams.thisType as InstanceType;
    expect(thisType).toBeInstanceOf(InstanceType);
    expect(thisType.name).toBe("User");
  });
});

describe("Precedence and associativity", () => {
  test("() => number | bigint", () => {
    const fn = parseType("() => number | bigint") as FunctionType;
    expect(fn).toBeInstanceOf(FunctionType);
    const returnType = fn.returnType as UnionType;
    expect(returnType).toBeInstanceOf(UnionType);
    expect(returnType.types.length).toBe(2);
    const numberType = returnType.types[0] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
    const bigintType = returnType.types[1] as PrimitiveType;
    expect(bigintType).toBeInstanceOf(PrimitiveType);
    expect(bigintType.name).toBe(PrimitiveTypeName.BigInt);
  });

  test("(()=>void) | ()=>Promise<void>", () => {
    const union = parseType("(() => void) | (() => Promise<void>)") as UnionType;
    expect(union).toBeInstanceOf(UnionType);
    expect(union.types.length).toBe(2);
    expect(union.types[0]).toBeInstanceOf(FunctionType);
    expect(union.types[1]).toBeInstanceOf(FunctionType);
  });

  test("string | number[] - array suffix binds tighter than union", () => {
    const type = parseType("string | number[]") as UnionType;
    expect(type).toBeInstanceOf(UnionType);
    expect(type.types.length).toBe(2);
    const stringType = type.types[0] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
    const arrayType = type.types[1] as GenericType;
    expect(arrayType).toBeInstanceOf(GenericType);
    expect(arrayType.name).toBe("Array");
    expect(arrayType.params.length).toBe(1);
    const numberType = arrayType.params[0] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
  });

  test("() => () => number | string", () => {
    const type = parseType("() => () => number | string") as FunctionType;
    expect(type).toBeInstanceOf(FunctionType);
    expect(type.params.length).toBe(0);
    expect(type.returnType).toBeInstanceOf(FunctionType);
    const innerFn = type.returnType as FunctionType;
    expect(innerFn.params.length).toBe(0);
    expect(innerFn.returnType).toBeInstanceOf(UnionType);
    const returnUnion = innerFn.returnType as UnionType;
    expect(returnUnion.types.length).toBe(2);
    const numberType = returnUnion.types[0] as PrimitiveType;
    expect(numberType).toBeInstanceOf(PrimitiveType);
    expect(numberType.name).toBe(PrimitiveTypeName.Number);
    const stringType = returnUnion.types[1] as PrimitiveType;
    expect(stringType).toBeInstanceOf(PrimitiveType);
    expect(stringType.name).toBe(PrimitiveTypeName.String);
  });
});

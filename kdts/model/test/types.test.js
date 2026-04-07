import { describe, expect, test } from "bun:test";
import {
  FunctionType,
  GenericType,
  InstanceType,
  Modifier,
  PrimitiveType,
  PrimitiveTypeName,
  StructType,
  TopType,
  TopTypeName,
  UnionType
} from "../types";

describe("PrimitiveType", () => {
  test("the null type", () => {
    const nullType = new PrimitiveType(PrimitiveTypeName.Null);
    expect(nullType.isNullable()).toBeTrue();
    expect(nullType.isOptional()).toBeFalse();
    expect(nullType.toClosureExpr()).toBe("null");
    expect(nullType.toClosureExpr({ toParam: true })).toBe("null");
    expect(nullType.toClosureExpr({ bare: true })).toBe("null");
  });

  test("the optional type", () => {
    const undefinedType = new PrimitiveType(PrimitiveTypeName.Undefined);
    expect(undefinedType.isNullable()).toBeFalse();
    expect(undefinedType.isOptional()).toBeTrue();
    expect(undefinedType.toClosureExpr()).toBe("undefined");
    expect(undefinedType.toClosureExpr({ toParam: true })).toBe("undefined=");
    expect(undefinedType.toClosureExpr({ bare: true })).toBe("undefined");
  });

  test("optional null", () => {
    const optNull = new PrimitiveType(PrimitiveTypeName.Null);
    optNull.modifiers |= Modifier.Optional;
    expect(optNull.isOptional()).toBeTrue();
    expect(optNull.isNullable()).toBeTrue();
    expect(optNull.toClosureExpr())
      .toBe("null|undefined");
    expect(optNull.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("null=");
    expect(optNull.toClosureExpr({ bare: true }))
      .toBe("null");
  });

  test("optional string", () => {
    const optString = new PrimitiveType(PrimitiveTypeName.String);
    optString.modifiers = Modifier.Optional;
    expect(optString.isOptional()).toBeTrue();
    expect(optString.toClosureExpr())
      .toBe("string|undefined");
    expect(optString.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("string=");
    expect(optString.toClosureExpr({ bare: true }))
      .toBe("string");
  });

  test("nullable optionals", () => {
    const nullableOptString = new PrimitiveType(PrimitiveTypeName.String);
    nullableOptString.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(nullableOptString.toClosureExpr())
      .toBe("?string|undefined");
    expect(nullableOptString.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("?string=");
    expect(nullableOptString.toClosureExpr({ bare: true }))
      .toBe("string");
  });

  test("bigint", () => {
    const bigintType = new PrimitiveType(PrimitiveTypeName.BigInt);
    expect(bigintType.isNullable()).toBeFalse();
    expect(bigintType.isOptional()).toBeFalse();
  });
});

describe("UnionType", () => {
  test("basics", () => {
    const numeric = new UnionType([
      new PrimitiveType(PrimitiveTypeName.Number),
      new PrimitiveType(PrimitiveTypeName.BigInt),
    ]);
    expect(numeric.toClosureExpr()).toBe("number|bigint");
    expect(numeric.toClosureExpr({ bare: true })).toBe("number|bigint");
  });

  test("similar type twice", () => {
    const maybeString = new PrimitiveType(PrimitiveTypeName.String);
    maybeString.modifiers = Modifier.Optional;
    const stringOrString = new UnionType([
      new PrimitiveType(PrimitiveTypeName.String),
      maybeString
    ]);
    expect(stringOrString.typeMap.size)
      .toBe(1);
    expect(stringOrString.toClosureExpr())
      .toBe("string|undefined");
    expect(stringOrString.toClosureExpr({ toParam: true }))
      .toBe("string=");
    expect(stringOrString.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("string=");
    expect(stringOrString.toClosureExpr({ bare: true }))
      .toBe("string");
  });

  test("union with any", () => {
    const stringOrAny = new UnionType([
      new PrimitiveType(PrimitiveTypeName.String),
      new TopType(TopTypeName.Any),
    ]);
    expect(stringOrAny.toClosureExpr()).toBe("?");
    expect(stringOrAny.toClosureExpr({ toParam: true })).toBe("?=");
    expect(stringOrAny.toClosureExpr({ bare: true })).toBe("?");
  });

  test("union with unknown", () => {
    const bigintOrUnknown = new UnionType([
      new PrimitiveType(PrimitiveTypeName.BigInt),
      new TopType(TopTypeName.Unknown),
    ]);
    expect(bigintOrUnknown.toClosureExpr()).toBe("*");
    expect(bigintOrUnknown.toClosureExpr({ toParam: true })).toBe("*=");
    expect(bigintOrUnknown.toClosureExpr({ bare: true })).toBe("*");
  });

  test("wrap and toParam", () => {
    const union = new UnionType([
      new PrimitiveType(PrimitiveTypeName.String),
      new PrimitiveType(PrimitiveTypeName.Number),
      new PrimitiveType(PrimitiveTypeName.Null),
      new PrimitiveType(PrimitiveTypeName.Undefined)
    ]);
    expect(union.isNullable()).toBeTrue();
    expect(union.isOptional()).toBeTrue();
    expect(union.toClosureExpr()).toBe("string|number|null|undefined");
    expect(union.toClosureExpr({ toParam: true }))
      .toBe("string|number|null=");
    expect(union.toClosureExpr({ wrap: true }))
      .toBe("(string|number|null|undefined)");
    expect(union.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("(string|number|null)=");
  });

  test("optional string", () => {
    const optString = new UnionType([
      new PrimitiveType(PrimitiveTypeName.String),
      new PrimitiveType(PrimitiveTypeName.Undefined)
    ]);
    expect(optString.toClosureExpr({ wrap: true }))
      .toBe("(string|undefined)");
    expect(optString.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("string=");
    expect(optString.toClosureExpr({ bare: true }))
      .toBe("string");
  });

  test("nested unions", () => {
    const optNumber = new PrimitiveType(PrimitiveTypeName.Number);
    optNumber.modifiers = Modifier.Optional;
    const union = new UnionType([
      optNumber,
      new PrimitiveType(PrimitiveTypeName.Boolean),
      new UnionType([
        new PrimitiveType(PrimitiveTypeName.Undefined),
        new PrimitiveType(PrimitiveTypeName.String)
      ])
    ]);
    expect(union.toClosureExpr())
      .toBe("number|boolean|string|undefined");
    expect(union.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("(number|boolean|string)=");
  });
});

describe("TopType", () => {
  test("any and unknown", () => {
    const any = new TopType(TopTypeName.Any);
    any.modifiers = Modifier.Optional;
    expect(any.toClosureExpr()).toBe("?");
    expect(any.toClosureExpr({ toParam: true })).toBe("?=");
    expect(any.toClosureExpr({ bare: true })).toBe("?");

    const unknown = new TopType(TopTypeName.Unknown);
    unknown.modifiers = Modifier.Nullable;
    expect(unknown.toClosureExpr()).toBe("*");
    expect(unknown.toClosureExpr({ toParam: true })).toBe("*=");
    expect(unknown.toClosureExpr({ bare: true })).toBe("*");
  });
});

describe("InstanceType", () => {
  test("default is non-nullable", () => {
    const user = new InstanceType("User");
    expect(user.toClosureExpr()).toBe("!User");
    expect(user.toClosureExpr({ toParam: true }))
      .toBe("!User");
    expect(user.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("!User");
    expect(user.toClosureExpr({ bare: true }))
      .toBe("!User");
  });

  test("nullable removes non-null prefix", () => {
    const user = new InstanceType("User");
    user.modifiers = Modifier.Nullable;
    expect(user.toClosureExpr())
      .toBe("?User");
    expect(user.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("?User");
    expect(user.toClosureExpr({ bare: true }))
      .toBe("!User");
  });

  test("optional user", () => {
    const optUser = new InstanceType("User");
    optUser.modifiers = Modifier.Optional;
    expect(optUser.toClosureExpr())
      .toBe("!User|undefined");
    expect(optUser.toClosureExpr({ wrap: true }))
      .toBe("(!User|undefined)");
    expect(optUser.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("!User=");
    expect(optUser.toClosureExpr({ bare: true }))
      .toBe("!User");
  });

  test("nullable optional user", () => {
    const nullableOptUser = new InstanceType("User");
    nullableOptUser.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(nullableOptUser.toClosureExpr())
      .toBe("?User|undefined");
    expect(nullableOptUser.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("?User=");
    expect(nullableOptUser.toClosureExpr({ bare: true }))
      .toBe("!User");
  });

  test("nullable optional user via union", () => {
    const nullableOptUser = new UnionType([
      new InstanceType("User"),
      new PrimitiveType(PrimitiveTypeName.Null),
      new PrimitiveType(PrimitiveTypeName.Undefined)
    ]);
    expect(nullableOptUser.toClosureExpr())
      .toBe("!User|null|undefined");
    expect(nullableOptUser.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("(!User|null)=");
    expect(nullableOptUser.toClosureExpr({ bare: true }))
      .toBe("!User");
  });
});

describe("GenericType", () => {
  test("union array", () => {
    const generic = new GenericType("Array", [
      new UnionType([new PrimitiveType(PrimitiveTypeName.String), new PrimitiveType(PrimitiveTypeName.Number)]),
    ]);
    generic.modifiers = Modifier.Optional;
    expect(generic.toClosureExpr()).toBe("!Array<string|number>|undefined");
    expect(generic.toClosureExpr({ toParam: true }))
      .toBe("!Array<string|number>=");

    generic.modifiers |= Modifier.Nullable;
    expect(generic.toClosureExpr()).toBe("Array<string|number>|undefined");
    expect(generic.toClosureExpr({ toParam: true }))
      .toBe("Array<string|number>=");
  });

  test("record type", () => {
    const record = new GenericType("Record", [
      new PrimitiveType(PrimitiveTypeName.String),
      new InstanceType("User")
    ]);
    expect(record.toClosureExpr()).toBe("!Object<string,!User>");
  }) 
});

describe("StructType", () => {
  test("basics", () => {
    const struct = new StructType({
      "a": new PrimitiveType(PrimitiveTypeName.String),
      "b": new PrimitiveType(PrimitiveTypeName.Number)
    });
    expect(struct.toClosureExpr()).toBe("{ a: string, b: number }");
  });

  test("wrap and toParam on a optional struct", () => {
    const struct = new StructType({
      "a": new PrimitiveType(PrimitiveTypeName.String),
      "b": new PrimitiveType(PrimitiveTypeName.Number)
    });
    struct.modifiers = Modifier.Optional;
    expect(struct.toClosureExpr())
      .toBe("{ a: string, b: number }|undefined");
    expect(struct.toClosureExpr({ toParam: true }))
      .toBe("{ a: string, b: number }=");
    expect(struct.toClosureExpr({ wrap: true }))
      .toBe("({ a: string, b: number }|undefined)");
    expect(struct.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("{ a: string, b: number }=");
  });

  test("wrap and toParam on a nullable struct", () => {
    const struct = new StructType({
      "a": new PrimitiveType(PrimitiveTypeName.String),
      "b": new PrimitiveType(PrimitiveTypeName.Number)
    });
    struct.modifiers = Modifier.Nullable;
    expect(struct.toClosureExpr())
      .toBe("?{ a: string, b: number }");
    expect(struct.toClosureExpr({ toParam: true }))
      .toBe("?{ a: string, b: number }");
    expect(struct.toClosureExpr({ wrap: true }))
      .toBe("?{ a: string, b: number }");
    expect(struct.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("?{ a: string, b: number }");
  });

  test("wrap and toParam on a nullable optional struct", () => {
    const struct = new StructType({
      "a": new PrimitiveType(PrimitiveTypeName.String),
    });
    struct.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(struct.toClosureExpr())
      .toBe("?{ a: string }|undefined");
    expect(struct.toClosureExpr({ toParam: true }))
      .toBe("?{ a: string }=");
    expect(struct.toClosureExpr({ wrap: true }))
      .toBe("(?{ a: string }|undefined)");
    expect(struct.toClosureExpr({ toParam: true, wrap: true }))
      .toBe("?{ a: string }=");
  });

  test("with optional fields", () => {
    const struct = new StructType({
      "a": new PrimitiveType(PrimitiveTypeName.String),
      "b": new PrimitiveType(PrimitiveTypeName.Number)
    });
    struct.members["b"].modifiers = Modifier.Optional;
    expect(struct.toClosureExpr())
      .toBe("{ a: string, b: (number|undefined) }");
    expect(struct.toClosureExpr({ toParam: true }))
      .toBe("{ a: string, b: (number|undefined) }");
  });

  test("nullable and optional", () => {
    const struct = new StructType({
      "a": new PrimitiveType(PrimitiveTypeName.String),
      "b": new PrimitiveType(PrimitiveTypeName.Number)
    });
    expect(struct.toClosureExpr()).toBe("{ a: string, b: number }");
    expect(struct.toClosureExpr({ toParam: true })).toBe("{ a: string, b: number }");

    struct.modifiers = Modifier.Nullable;
    expect(struct.toClosureExpr()).toBe("?{ a: string, b: number }");
    expect(struct.toClosureExpr({ toParam: true })).toBe("?{ a: string, b: number }");

    struct.modifiers = Modifier.Optional;
    expect(struct.toClosureExpr()).toBe("{ a: string, b: number }|undefined");
    expect(struct.toClosureExpr({ toParam: true })).toBe("{ a: string, b: number }=");

    struct.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(struct.toClosureExpr()).toBe("?{ a: string, b: number }|undefined");
    expect(struct.toClosureExpr({ toParam: true })).toBe("?{ a: string, b: number }=");

    struct.modifiers = 0;
    struct.members["a"] = new UnionType([
      new PrimitiveType(PrimitiveTypeName.String),
      new PrimitiveType(PrimitiveTypeName.Number)
    ]);
    expect(struct.toClosureExpr()).toBe("{ a: (string|number), b: number }");
    expect(struct.toClosureExpr({ toParam: true })).toBe("{ a: (string|number), b: number }");
  });
});

describe("FunctionType", () => {
  test("function without a return value", () => {
    // Basic function with no parameters
    const voidFn = new FunctionType(
        [],
        undefined,
        new PrimitiveType(PrimitiveTypeName.Undefined)
      );
    expect(voidFn.toClosureExpr()).toBe("function()");
  });

  test("function with parameters and return type", () => {
    // Function with parameters and return type
    const basicFn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String), new PrimitiveType(PrimitiveTypeName.Number)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Boolean)
    );
    expect(basicFn.toClosureExpr()).toBe("function(string, number): boolean");
  });

  test("function with union types and optional parameters", () => {
    // Function with optional parameters
    const optParamFn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String), new PrimitiveType(PrimitiveTypeName.Number)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Boolean),
      false,
      1 // optionalAfter = 1 means params[1] and beyond are optional
    );
    optParamFn.params[1].modifiers = Modifier.Optional;
    expect(optParamFn.toClosureExpr()).toBe("function(string, number=): boolean");
  });

  test("optional function(string)->number", () => {
    // Optional function
    const optFn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Number)
    );
    optFn.modifiers = Modifier.Optional;
    expect(optFn.toClosureExpr())
      .toBe("function(string): number|undefined");
    expect(optFn.toClosureExpr({ toParam: true }))
      .toBe("function(string): number=");
  });

  test("MyClass method mapping string->number", () => {
    const method = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Number),
      false,
      1,
      new InstanceType("MyClass")
    );
    expect(method.toClosureExpr()).toBe("function(this:MyClass, string): number");
  });

  test("function with complex parameters", () => {
    const complexFn = new FunctionType([
      new UnionType([new PrimitiveType(PrimitiveTypeName.String), new PrimitiveType(PrimitiveTypeName.Number)]),
      new StructType({
        id: new PrimitiveType(PrimitiveTypeName.String),
        count: new PrimitiveType(PrimitiveTypeName.Number)
      })
    ],
      undefined,
      new GenericType("Array", [new PrimitiveType(PrimitiveTypeName.String)]),
      false,
      1
    );
    complexFn.params[1].modifiers = Modifier.Optional;
    expect(complexFn.toClosureExpr()).toBe(
      "function((string|number), { id: string, count: number }=): !Array<string>"
    );
  });
});

describe("toTsExpr (TS/JSDoc inside {})", () => {
  test("InstanceType: no !, optional toParam =", () => {
    const user = new InstanceType("User");
    expect(user.toTsExpr()).toBe("User");
    user.modifiers = Modifier.Optional;
    expect(user.toTsExpr()).toBe("User | undefined");
    expect(user.toTsExpr({ toParam: true })).toBe("User=");
  });

  test("Array as T[]", () => {
    const arr = new GenericType("Array", [new InstanceType("User")]);
    expect(arr.toTsExpr()).toBe("User[]");
  });

  test("ReadonlyArray as readonly T[]", () => {
    const arr = new GenericType("ReadonlyArray", [new InstanceType("User")]);
    expect(arr.toTsExpr()).toBe("readonly User[]");
  });

  test("optional array toParam: User[]=", () => {
    const arr = new GenericType("Array", [new InstanceType("User")]);
    arr.modifiers = Modifier.Optional;
    expect(arr.toTsExpr()).toBe("User[] | undefined");
    expect(arr.toTsExpr({ toParam: true })).toBe("User[]=");
  });

  test("nullable and undefined explicit", () => {
    const u = new InstanceType("User");
    u.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(u.toTsExpr()).toBe("User | null | undefined");
    expect(u.toTsExpr({ toParam: true })).toBe("User | null=");
  });

  test("any and unknown", () => {
    const any = new TopType(TopTypeName.Any);
    expect(any.toTsExpr()).toBe("any");
    expect(any.toTsExpr({ toParam: true })).toBe("any=");
    const unknown = new TopType(TopTypeName.Unknown);
    expect(unknown.toTsExpr()).toBe("unknown");
  });

  test("function type", () => {
    const fn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Number)
    );
    expect(fn.toTsExpr()).toBe("(arg0: string) => number");
  });

  test("optional function: bare × toParam (4 combos)", () => {
    const fn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Number)
    );
    fn.modifiers = Modifier.Optional;
    expect(fn.toTsExpr({ bare: false, toParam: false }))
      .toBe("((arg0: string) => number) | undefined");
    expect(fn.toTsExpr({ bare: false, toParam: true }))
      .toBe("(arg0: string) => number=");
    expect(fn.toTsExpr({ bare: true, toParam: false }))
      .toBe("(arg0: string) => number");
    expect(fn.toTsExpr({ bare: true, toParam: true }))
      .toBe("(arg0: string) => number");
  });

  test("toTsDoc", () => {
    const fn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String), new PrimitiveType(PrimitiveTypeName.Number)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Boolean)
    );
    expect(fn.toTsDoc()).toBe(
      "/**\n" +
      " * @param {string} arg0\n" +
      " * @param {number} arg1\n" +
      " * @return {boolean}\n" +
      " */"
    );
  });

  test("toTsDoc optional param", () => {
    const fn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String), new PrimitiveType(PrimitiveTypeName.Number)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Boolean),
      false,
      1
    );
    fn.params[1].modifiers = Modifier.Optional;
    expect(fn.toTsDoc()).toBe(
      "/**\n" +
      " * @param {string} arg0\n" +
      " * @param {number=} arg1\n" +
      " * @return {boolean}\n" +
      " */"
    );
  });

  test("toTsDoc rest param", () => {
    const fn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.String), new GenericType("Array", [new PrimitiveType(PrimitiveTypeName.Number)])],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Undefined),
      true,
      2
    );
    expect(fn.toTsDoc()).toBe(
      "/**\n" +
      " * @param {string} arg0\n" +
      " * @param {...number[]} arg1\n" +
      " * @return {undefined}\n" +
      " */"
    );
  });

  test("toTsDoc NoInline NoSideEffects Pure", () => {
    const fn = new FunctionType(
      [new PrimitiveType(PrimitiveTypeName.Number)],
      undefined,
      new PrimitiveType(PrimitiveTypeName.Number)
    );
    fn.modifiers = Modifier.NoInline | Modifier.SideEffectFree | Modifier.Pure;
    expect(fn.toTsDoc()).toBe(
      "/**\n" +
      " * @noinline\n" +
      " * @nosideeffects\n" +
      " * @pureOrBreakMyCode\n" +
      " * @param {number} arg0\n" +
      " * @return {number}\n" +
      " */"
    );
  });
});

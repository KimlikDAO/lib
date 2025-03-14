import { describe, expect, test } from "bun:test";
import {
  FunctionType,
  GenericType,
  InstanceType,
  Modifier,
  PrimitiveType,
  PrimitiveTypes,
  StructType,
  UnionType
} from "../types";

describe("Serialization tests", () => {
  test("PrimitiveType", () => {
    const optString = new PrimitiveType("string");
    optString.modifiers = Modifier.Optional;
    expect(optString.toClosureExpr()).toEqual("string|undefined");
    expect(optString.toClosureExpr({ toParam: true })).toEqual("string=");

    const optNullableString = new PrimitiveType("string");
    optNullableString.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(optNullableString.toClosureExpr()).toEqual("?string|undefined");
    expect(optNullableString.toClosureExpr({ toParam: true })).toEqual("?string=");
  });

  test("InstanceType", () => {
    const user = new InstanceType("User");
    user.modifiers = Modifier.Optional;
    expect(user.toClosureExpr()).toEqual("!User|undefined");
    expect(user.toClosureExpr({ toParam: true })).toEqual("!User=");
  });

  test("UnionType", () => {
    const union = new UnionType([
      new PrimitiveType("string"),
      new PrimitiveType("number"),
      new PrimitiveType("null"),
      new PrimitiveType("undefined")
    ]);
    expect(union.modifiers).toEqual(Modifier.Optional | Modifier.Nullable);
    expect(union.toClosureExpr()).toEqual("string|number|null|undefined");
    expect(union.toClosureExpr({ toParam: true }))
      .toEqual("(string|number|null)=");
    expect(union.toClosureExpr({ wrap: true }))
      .toEqual("(string|number|null|undefined)");
  });

  test("GenericType", () => {
    const generic = new GenericType("Array", [
      new UnionType([new PrimitiveType("string"), new PrimitiveType("number")]),
    ]);
    generic.modifiers = Modifier.Optional;
    expect(generic.toClosureExpr()).toEqual("!Array<string|number>|undefined");
    expect(generic.toClosureExpr({ toParam: true }))
      .toEqual("!Array<string|number>=");

    generic.modifiers |= Modifier.Nullable;
    expect(generic.toClosureExpr()).toEqual("Array<string|number>|undefined");
    expect(generic.toClosureExpr({ toParam: true }))
      .toEqual("Array<string|number>=");
  });

  test("StructType", () => {
    const struct = new StructType({
      "a": new PrimitiveType("string"),
      "b": new PrimitiveType("number")
    });
    expect(struct.toClosureExpr()).toEqual("{ a: string, b: number }");
    expect(struct.toClosureExpr({ toParam: true })).toEqual("{ a: string, b: number }");

    struct.modifiers = Modifier.Nullable;
    expect(struct.toClosureExpr()).toEqual("?{ a: string, b: number }");
    expect(struct.toClosureExpr({ toParam: true })).toEqual("?{ a: string, b: number }");

    struct.modifiers = Modifier.Optional;
    expect(struct.toClosureExpr()).toEqual("{ a: string, b: number }|undefined");
    expect(struct.toClosureExpr({ toParam: true })).toEqual("{ a: string, b: number }=");

    struct.modifiers = Modifier.Nullable | Modifier.Optional;
    expect(struct.toClosureExpr()).toEqual("?{ a: string, b: number }|undefined");
    expect(struct.toClosureExpr({ toParam: true })).toEqual("?{ a: string, b: number }=");

    struct.modifiers = 0;
    struct.members["a"] = new UnionType([
      new PrimitiveType("string"),
      new PrimitiveType("number")
    ]);
    expect(struct.toClosureExpr()).toEqual("{ a: (string|number), b: number }");
    expect(struct.toClosureExpr({ toParam: true })).toEqual("{ a: (string|number), b: number }");
  });

  test("FunctionType", () => {
    // Basic function with no parameters
    const voidFn = new FunctionType(
      [],
      new PrimitiveType(PrimitiveTypes.Void)
    );
    expect(voidFn.toClosureExpr()).toEqual("function()");

    // Function with parameters and return type
    const basicFn = new FunctionType(
      [new PrimitiveType("string"), new PrimitiveType("number")],
      new PrimitiveType("boolean")
    );
    expect(basicFn.toClosureExpr()).toEqual("function(string, number): boolean");

    // Function with optional parameters
    const optParamFn = new FunctionType(
      [new PrimitiveType("string"), new PrimitiveType("number")],
      new PrimitiveType("boolean"),
      1 // optionalAfter = 1 means params[1] and beyond are optional
    );
    optParamFn.params[1].modifiers = Modifier.Optional;
    expect(optParamFn.toClosureExpr()).toEqual("function(string, number=): boolean");

    // Optional function
    const optFn = new FunctionType(
      [new PrimitiveType("string")],
      new PrimitiveType("number")
    );
    optFn.modifiers = Modifier.Optional;
    expect(optFn.toClosureExpr()).toEqual("function(string): number|undefined");
    expect(optFn.toClosureExpr({ toParam: true })).toEqual("function(string): number=");

    // Method with this type
    const method = new FunctionType(
      [new PrimitiveType("string")],
      new PrimitiveType("number"),
      1,
      new InstanceType("MyClass")
    );
    expect(method.toClosureExpr()).toEqual("function(this:MyClass, string): number");

    // Complex function with union types and optional parameters
    const complexFn = new FunctionType(
      [
        new UnionType([new PrimitiveType("string"), new PrimitiveType("number")]),
        new StructType({
          id: new PrimitiveType("string"),
          count: new PrimitiveType("number")
        })
      ],
      new GenericType("Array", [new PrimitiveType("string")]),
      1
    );
    complexFn.params[1].modifiers = Modifier.Optional;
    expect(complexFn.toClosureExpr()).toEqual(
      "function((string|number), { id: string, count: number }=): !Array<string>"
    );
  });
});

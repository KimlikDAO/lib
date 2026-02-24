import { describe, expect, test } from "bun:test";
import { fromAcornType } from "../converter";
import {
  GenericType,
  InstanceType,
  PrimitiveType,
  PrimitiveTypeName,
  TopType,
  TopTypeName,
  UnionType,
} from "../types";

/**
 * Minimal acorn-like nodes (plain data) for converter tests
 *
 * @param {string} type
 * @param {Object} props
 * @return {acorn.Node}
 */
const node = (type, props = {}) => ({ type, ...props });

describe("fromAcornType primitives", () => {
  test("number", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSNumberKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Number);
  });

  test("string", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSStringKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.String);
  });

  test("boolean", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSBooleanKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Boolean);
  });

  test("bigint", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSBigIntKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.BigInt);
  });

  test("void → Undefined", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSVoidKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Undefined);
  });

  test("void toClosureExpr", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSVoidKeyword")));
    expect(t.toClosureExpr()).toBe("undefined");
  });

  test("null", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSNullKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Null);
  });

  test("null toClosureExpr", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSNullKeyword")));
    expect(t.toClosureExpr()).toBe("null");
  });

  test("undefined", () => {
    const t = /** @type {PrimitiveType} */(fromAcornType(node("TSUndefinedKeyword")));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Undefined);
  });
});

describe("fromAcornType top types", () => {
  test("any", () => {
    const t = /** @type {TopType} */(fromAcornType(node("TSAnyKeyword")));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Any);
  });

  test("unknown", () => {
    const t = /** @type {TopType} */(fromAcornType(node("TSUnknownKeyword")));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Unknown);
  });
});

describe("fromAcornType union", () => {
  test("string | number", () => {
    const u = /** @type {UnionType} */(
      fromAcornType(
        node("TSUnionType", {
          types: [node("TSStringKeyword"), node("TSNumberKeyword")],
        })
      )
    );
    expect(u).toBeInstanceOf(UnionType);
    expect(u.toClosureExpr()).toBe("string|number");
  });

  test("union with null and undefined as modifiers", () => {
    const u = /** @type {UnionType} */(
      fromAcornType(
        node("TSUnionType", {
          types: [
            node("TSStringKeyword"),
            node("TSNullKeyword"),
            node("TSUndefinedKeyword"),
          ],
        })
      )
    );
    expect(u).toBeInstanceOf(UnionType);
    expect(u.isNullable()).toBeTrue();
    expect(u.isOptional()).toBeTrue();
    expect(u.toClosureExpr()).toBe("string|null|undefined");
  });
});

describe("fromAcornType array", () => {
  test("number[]", () => {
    const arr = /** @type {GenericType} */(
      fromAcornType(
        node("TSArrayType", {
          elementType: node("TSNumberKeyword"),
        })
      )
    );
    expect(arr).toBeInstanceOf(GenericType);
    expect(arr.name).toBe("Array");
    expect(arr.params).toHaveLength(1);
    expect(arr.params[0].name).toBe(PrimitiveTypeName.Number);
    expect(arr.toClosureExpr()).toBe("!Array<number>");
  });
});

describe("fromAcornType TSTypeAnnotation", () => {
  test("unwraps to inner type", () => {
    const wrapped = node("TSTypeAnnotation", {
      typeAnnotation: node("TSStringKeyword"),
    });
    const t = /** @type {PrimitiveType} */(fromAcornType(wrapped));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.String);
  });
});

describe("fromAcornType TSTypeReference", () => {
  test("without params → InstanceType", () => {
    const ref = node("TSTypeReference", {
      typeName: node("Identifier", { name: "ChainId" }),
    });
    const t = /** @type {InstanceType} */(fromAcornType(ref));
    expect(t).toBeInstanceOf(InstanceType);
    expect(t.name).toBe("ChainId");
  });

  test("with params → GenericType", () => {
    const ref = node("TSTypeReference", {
      typeName: node("Identifier", { name: "Array" }),
      typeArguments: node("TSTypeParameterInstantiation", {
        params: [node("TSNumberKeyword")],
      }),
    });
    const t = /** @type {GenericType} */(fromAcornType(ref));
    expect(t).toBeInstanceOf(GenericType);
    expect(t.name).toBe("Array");
    expect(t.params[0].name).toBe(PrimitiveTypeName.Number);
  });
});

describe("fromAcornType TSTypeOperator", () => {
  test("readonly array → ReadonlyArray", () => {
    const op = node("TSTypeOperator", {
      operator: "readonly",
      typeAnnotation: node("TSArrayType", {
        elementType: node("TSStringKeyword"),
      }),
    });
    const t = /** @type {GenericType} */(fromAcornType(op));
    expect(t).toBeInstanceOf(GenericType);
    expect(t.name).toBe("ReadonlyArray");
    expect(t.params[0].name).toBe(PrimitiveTypeName.String);
  });
});

describe("fromAcornType TSIntersectionType", () => {
  test("→ unknown", () => {
    const inter = node("TSIntersectionType", { types: [] });
    const t = /** @type {TopType} */(fromAcornType(inter));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Unknown);
  });
});

describe("fromAcornType unknown node type", () => {
  test("→ unknown", () => {
    const t = /** @type {TopType} */(fromAcornType(node("TSMappedType")));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Unknown);
  });
});

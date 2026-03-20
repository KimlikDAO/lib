import { describe, expect, test } from "bun:test";
import { propagateType } from "../converter";
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
 * Creates a typed acorn-like node (for use as a child in composite nodes).
 * @param {string} type
 * @param {Object} props
 * @return {acorn.Node}
 */
const node = (type, props = {}) => {
  const n = { type, ...props };
  propagateType(n);
  return n;
};

/**
 * Creates a typed acorn-like node and returns its typeExpression for assertions.
 * @param {string} type
 * @param {Object} props
 * @return {Type}
 */
const nodeType = (type, props = {}) => {
  const n = { type, ...props };
  propagateType(n);
  return n.typeExpression;
};

describe("propagateType primitives", () => {
  test("number", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSNumberKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Number);
  });

  test("string", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSStringKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.String);
  });

  test("boolean", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSBooleanKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Boolean);
  });

  test("bigint", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSBigIntKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.BigInt);
  });

  test("void → Undefined", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSVoidKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Undefined);
  });

  test("void toClosureExpr", () => {
    expect(nodeType("TSVoidKeyword").toClosureExpr()).toBe("undefined");
  });

  test("null", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSNullKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Null);
  });

  test("null toClosureExpr", () => {
    expect(nodeType("TSNullKeyword").toClosureExpr()).toBe("null");
  });

  test("undefined", () => {
    const t = /** @type {PrimitiveType} */(nodeType("TSUndefinedKeyword"));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.Undefined);
  });
});

describe("propagateType top types", () => {
  test("any", () => {
    const t = /** @type {TopType} */(nodeType("TSAnyKeyword"));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Any);
  });

  test("unknown", () => {
    const t = /** @type {TopType} */(nodeType("TSUnknownKeyword"));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Unknown);
  });
});

describe("propagateType union", () => {
  test("string | number", () => {
    const str = node("TSStringKeyword");
    const num = node("TSNumberKeyword");
    const u = /** @type {UnionType} */(nodeType("TSUnionType", { types: [str, num] }));
    expect(u).toBeInstanceOf(UnionType);
    expect(u.toClosureExpr()).toBe("string|number");
  });

  test("union with null and undefined as modifiers", () => {
    const str = node("TSStringKeyword");
    const n = node("TSNullKeyword");
    const undef = node("TSUndefinedKeyword");
    const u = /** @type {UnionType} */(nodeType("TSUnionType", { types: [str, n, undef] }));
    expect(u).toBeInstanceOf(UnionType);
    expect(u.isNullable()).toBeTrue();
    expect(u.isOptional()).toBeTrue();
    expect(u.toClosureExpr()).toBe("string|null|undefined");
  });
});

describe("propagateType array", () => {
  test("number[]", () => {
    const el = node("TSNumberKeyword");
    const arr = /** @type {GenericType} */(nodeType("TSArrayType", { elementType: el }));
    expect(arr).toBeInstanceOf(GenericType);
    expect(arr.name).toBe("Array");
    expect(arr.params).toHaveLength(1);
    expect(arr.params[0].name).toBe(PrimitiveTypeName.Number);
    expect(arr.toClosureExpr()).toBe("!Array<number>");
  });
});

describe("propagateType TSTypeAnnotation", () => {
  test("unwraps to inner type", () => {
    const inner = node("TSStringKeyword");
    const t = /** @type {PrimitiveType} */(nodeType("TSTypeAnnotation", { typeAnnotation: inner }));
    expect(t).toBeInstanceOf(PrimitiveType);
    expect(t.name).toBe(PrimitiveTypeName.String);
  });
});

describe("propagateType TSTypeReference", () => {
  test("without params → InstanceType", () => {
    const t = /** @type {InstanceType} */(nodeType("TSTypeReference", {
      typeName: node("Identifier", { name: "ChainId" }),
    }));
    expect(t).toBeInstanceOf(InstanceType);
    expect(t.name).toBe("ChainId");
  });

  test("with params → GenericType", () => {
    const param = node("TSNumberKeyword");
    const t = /** @type {GenericType} */(nodeType("TSTypeReference", {
      typeName: node("Identifier", { name: "Array" }),
      typeArguments: node("TSTypeParameterInstantiation", { params: [param] }),
    }));
    expect(t).toBeInstanceOf(GenericType);
    expect(t.name).toBe("Array");
    expect(t.params[0].name).toBe(PrimitiveTypeName.Number);
  });
});

describe("propagateType TSTypeOperator", () => {
  test("readonly array → ReadonlyArray", () => {
    const el = node("TSStringKeyword");
    const arr = node("TSArrayType", { elementType: el });
    const t = /** @type {GenericType} */(nodeType("TSTypeOperator", { operator: "readonly", typeAnnotation: arr }));
    expect(t).toBeInstanceOf(GenericType);
    expect(t.name).toBe("ReadonlyArray");
    expect(t.params[0].name).toBe(PrimitiveTypeName.String);
  });
});

describe("propagateType TSIntersectionType", () => {
  test("→ unknown", () => {
    const t = /** @type {TopType} */(nodeType("TSIntersectionType", { types: [] }));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Unknown);
  });
});

describe("propagateType unknown node type", () => {
  test("→ unknown", () => {
    const t = /** @type {TopType} */(nodeType("TSMappedType"));
    expect(t).toBeInstanceOf(TopType);
    expect(t.name).toBe(TopTypeName.Unknown);
  });
});

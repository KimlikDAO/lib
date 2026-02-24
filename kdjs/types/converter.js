import {
  GenericType,
  InstanceType,
  PrimitiveType,
  PrimitiveTypeName,
  TopType,
  TopTypeName,
  UnionType,
} from "./types";

/**
 * @param {acorn.Node} typeName - Identifier or TSQualifiedName
 * @return {string}
 */
const typeNameToString = (typeName) => {
  if (!typeName) return UnknownType;
  let suffix = "";
  while (typeName.type == "TSQualifiedName") {
    suffix = `${typeName.right.name}.${suffix}`;
    typeName = typeName.left;
  }
  return typeName.name + suffix;
};

const UnknownType = new TopType(TopTypeName.Unknown);

/**
 * @param {acorn.Node} node
 * @return {Type}
 */
const AcornTypeToType = {
  convert(type) {
    if (!type) return UnknownType;
    const handler = this[type.type];
    if (handler) return handler.call(this, type);
    return UnknownType;
  },

  TSTypeAnnotation(node) {
    return this.convert(node.typeAnnotation);
  },

  TSStringKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.String);
  },
  TSNumberKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.Number);
  },
  TSBooleanKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.Boolean);
  },
  TSBigIntKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.BigInt);
  },
  TSSymbolKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.Symbol);
  },
  TSVoidKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.Undefined);
  },
  TSNullKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.Null);
  },
  TSUndefinedKeyword(node) {
    return new PrimitiveType(PrimitiveTypeName.Undefined);
  },

  TSAnyKeyword(node) {
    return new TopType(TopTypeName.Any);
  },
  TSUnknownKeyword(node) {
    return new TopType(TopTypeName.Unknown);
  },

  TSUnionType(node) {
    const types = (node.types || []).map((t) => this.convert(t));
    return new UnionType(types);
  },

  TSArrayType(node) {
    const elementType = this.convert(node.elementType);
    return new GenericType("Array", [elementType]);
  },

  TSTypeOperator(node) {
    if (node.operator == "readonly") {
      const inner = this.convert(node.typeAnnotation);
      if (inner instanceof GenericType && inner.name == "Array")
        return new GenericType("ReadonlyArray", inner.params);
      return new GenericType("ReadonlyArray", [inner]);
    }
    return new TopType(TopTypeName.Unknown);
  },

  TSParenthesizedType(node) {
    return this.convert(node.typeAnnotation);
  },

  TSTypeReference(node) {
    const name = typeNameToString(node.typeName);
    const args = node.typeArguments || node.typeParameters;
    const params =
      args && args.params
        ? args.params.map((p) => this.convert(p))
        : null;
    if (params && params.length > 0)
      return new GenericType(name, params);
    return new InstanceType(name);
  },

  Identifier(node) {
    return new InstanceType(node.name || "");
  },

  TSLiteralType(node) {
    const lit = node.literal;
    if (!lit) return new TopType(TopTypeName.Unknown);
    if (lit.type == "Literal") {
      const t = typeof lit.value;
      if (t == "string") return new PrimitiveType(PrimitiveTypeName.String);
      if (t == "number") return new PrimitiveType(PrimitiveTypeName.Number);
      if (t == "boolean") return new PrimitiveType(PrimitiveTypeName.Boolean);
      if (lit.value == null) return new PrimitiveType(PrimitiveTypeName.Null);
    }
    return new TopType(TopTypeName.Unknown);
  },

  TSIntersectionType(node) {
    return new TopType(TopTypeName.Unknown);
  },
};

/**
 * @param {acorn.Node | null | undefined} type
 * @return {Type}
 */
const fromAcornType = (type) => AcornTypeToType.convert(type);

export { fromAcornType };

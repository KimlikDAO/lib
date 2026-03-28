import {
  AnyType,
  BigIntType,
  BooleanType,
  FunctionType,
  GenericType,
  InstanceType,
  NullType,
  NumberType,
  StringType,
  SymbolType,
  UndefinedType,
  UnionType,
  UnknownType,
} from "../model/types";

/**
 * @param {acorn.Node} typeName - Identifier or TSQualifiedName
 * @return {string}
 */
const typeNameToString = (typeName) => {
  if (!typeName) return "";
  let suffix = "";
  while (typeName.type == "TSQualifiedName") {
    suffix = `${typeName.right.name}.${suffix}`;
    typeName = typeName.left;
  }
  return typeName.name + suffix;
};

/**
 * Each handler sets node.typeExpression from the node's immediate children' typeExpressions.
 * Contract: children already have typeExpression (caller visits in post-order).
 */
const AcornTypeToType = {
  TSTypeAnnotation(node) {
    const child = node.typeAnnotation;
    node.typeExpression = child?.typeExpression ?? UnknownType;
  },

  TSStringKeyword(node) { node.typeExpression = StringType; },
  TSNumberKeyword(node) { node.typeExpression = NumberType; },
  TSBooleanKeyword(node) { node.typeExpression = BooleanType; },
  TSBigIntKeyword(node) { node.typeExpression = BigIntType; },
  TSSymbolKeyword(node) { node.typeExpression = SymbolType; },
  TSVoidKeyword(node) { node.typeExpression = UndefinedType; },
  TSNullKeyword(node) { node.typeExpression = NullType; },
  TSUndefinedKeyword(node) { node.typeExpression = UndefinedType; },
  TSAnyKeyword(node) { node.typeExpression = AnyType; },
  TSUnknownKeyword(node) { node.typeExpression = UnknownType; },

  TSUnionType(node) {
    const types = (node.types || []).map((c) => c.typeExpression).filter((t) => t != null);
    node.typeExpression = new UnionType(types);
  },

  TSArrayType(node) {
    const elementType = node.elementType?.typeExpression ?? UnknownType;
    node.typeExpression = new GenericType("Array", [elementType]);
  },

  TSTypeOperator(node) {
    const inner = node.typeAnnotation?.typeExpression;
    if (inner == null) { node.typeExpression = UnknownType; return; }
    node.typeExpression = inner instanceof GenericType && inner.name == "Array"
      ? new GenericType("ReadonlyArray", inner.params)
      : new GenericType("ReadonlyArray", [inner]);
  },

  TSParenthesizedType(node) {
    node.typeExpression = node.typeAnnotation?.typeExpression ?? UnknownType;
  },

  TSTypeReference(node) {
    const name = typeNameToString(node.typeName);
    const args = node.typeArguments || node.typeParameters;
    const params = args?.params?.map((p) => p.typeExpression ?? UnknownType) ?? null;
    node.typeExpression = params && params.length > 0
      ? new GenericType(name, params)
      : new InstanceType(name);
  },

  Identifier(node) {
    node.typeExpression = new InstanceType(node.name || "");
  },

  TSLiteralType(node) {
    const lit = node.literal;
    if (lit?.type == "Literal") {
      const t = typeof lit.value;
      if (t == "string") { node.typeExpression = StringType; return; }
      if (t == "number") { node.typeExpression = NumberType; return; }
      if (t == "boolean") { node.typeExpression = BooleanType; return; }
      if (lit.value == null) { node.typeExpression = NullType; return; }
    }
  },

  TSFunctionType(node) {
    const params = node.parameters || node.params || [];
    const paramTypes = params.map((p) => p.typeExpression ?? UnknownType);
    const paramNames = params.map((p) => {
      if (p.type === "Identifier") return p.name;
      if (p.type === "AssignmentPattern" && p.left?.type === "Identifier") return p.left.name;
      if (p.type === "RestElement" && p.argument?.type === "Identifier") return p.argument.name;
      return undefined;
    });
    const returnType = (node.typeAnnotation ?? node.returnType)?.typeExpression ?? UndefinedType;
    const rest = params.length > 0 && params[params.length - 1].type === "RestElement";
    let optionalAfter = params.findIndex((p) => p.optional === true);
    if (optionalAfter < 0) optionalAfter = params.length;
    node.typeExpression = new FunctionType(paramTypes, paramNames, returnType, rest, optionalAfter);
  },
  ArrowFunctionExpression(node) { this.TSFunctionType(node); },
  TSConstructorType(node) { this.TSFunctionType(node); },

  TSIntersectionType(node) {
    node.typeExpression = UnknownType;
  },

  propagate(node) {
    const handler = this[node.type];
    if (handler) handler.call(this, node);
    else node.typeExpression = UnknownType;
  },
};

/**
 * Sets node.typeExpression from its immediate children' typeExpressions; returns it.
 * Call in post-order so children already have typeExpression.
 * @param {acorn.Node | null | undefined} node
 */
const propagateType = (node) => { if (node) AcornTypeToType.propagate(node); };

export { propagateType };

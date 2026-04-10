import { isIdentifier } from "./guards";
import { TSArrayType, TSTupleType, TSTypeReference } from "./types";

const probeLiteralType = (n: any): any => {
  if (!n || n.type != "Literal") return;
  const v = n.value;
  if (v == null) return { type: "TSNullKeyword" };
  switch (typeof v) {
    case "string": return { type: "TSStringKeyword" };
    case "number": return { type: "TSNumberKeyword" };
    case "boolean": return { type: "TSBooleanKeyword" };
    case "bigint": return { type: "TSBigIntKeyword" };
  }
};

const probeNewExpressionType = (n: any): any => {
  if (!n || n.type != "NewExpression") return;
  if (n.callee?.type != "Identifier" || !n.typeArguments?.params?.length) return;
  return {
    type: "TSTypeReference",
    typeName: n.callee,
    typeArguments: n.typeArguments
  };
};

const probeArrayExpressionType = (n: any): any => {
  if (!n || n.type != "ArrayExpression" || !n.elements?.length)
    return;

  const firstElement = n.elements[0];
  if (!firstElement || firstElement.type == "SpreadElement")
    return;
  const elementType = probeLiteralType(firstElement);
  if (!elementType)
    return;

  for (let i = 1; i < n.elements.length; ++i) {
    const element = n.elements[i];
    if (!element || element.type == "SpreadElement" ||
      probeLiteralType(element)?.type != elementType.type)
      return;
  }
  return {
    type: "TSArrayType",
    elementType
  };
};

const probeExpressionType = (n: any): any =>
  probeLiteralType(n) ||
  probeArrayExpressionType(n) ||
  probeNewExpressionType(n);

const probeEnumType = (n: any): string => {
  let hasString = false;
  let hasNumber = false;
  for (const member of n.members) {
    const init = member.initializer;
    if (!init) {
      hasNumber = true; // auto-increment
    } else if (
      init.type == "StringLiteral" ||
      (init.type == "Literal" && typeof init.value == "string")
    ) {
      hasString = true;
    } else {
      hasNumber = true; // number or other
    }
  }
  if (hasString && hasNumber) {
    const name = n.id?.name ?? "enum";
    const locEnd = n.loc?.end ? ` ${n.loc.end.line}:${n.loc.end.column}` : "";
    const err = new Error(
      `Mixed enums (string and number) are not supported. Use a string-only or number-only enum: ${name}${locEnd}`
    );
    throw err;
  }
  return hasString ? "string" : "number";
};

const probeTypeReferenceArgs = (n: Node | undefined, ...names: string[]): Node[] | void => {
  if (!n || n.type != "TSTypeReference") return;
  const typeName = (n as TSTypeReference).typeName;
  if (!isIdentifier(typeName) || !names.includes(typeName.name)) return;
  return (n as TSTypeReference).typeArguments?.params;
};

const probeTypeReferenceArg = (
  n: Node | undefined,
  names: string | string[],
  position: number
): Node | void => {
  const allNames = Array.isArray(names) ? names : [names];
  return probeTypeReferenceArgs(n, ...allNames)?.[position];
};

const probeArrayLikeElementType = (n: Node | undefined): Node | void => {
  if (!n) return;
  if (n.type == "TSTupleType")
    return (n as TSTupleType).elementTypes[0];
  if (n.type == "TSArrayType")
    return (n as TSArrayType).elementType;
  return probeTypeReferenceArg(n, ["Array", "ReadonlyArray"], 0);
}

export {
  probeArrayLikeElementType,
  probeEnumType,
  probeExpressionType,
  probeTypeReferenceArg,
  probeTypeReferenceArgs
};

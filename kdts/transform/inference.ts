
const inferLiteralType = (n: any): any => {
  if (!n || n.type != "Literal") return;
  const v = n.value;
  if (v === null) return { type: "TSNullKeyword" };
  switch (typeof v) {
    case "string": return { type: "TSStringKeyword" };
    case "number": return { type: "TSNumberKeyword" };
    case "boolean": return { type: "TSBooleanKeyword" };
    case "bigint": return { type: "TSBigIntKeyword" };
  }
};

const inferNewExpressionType = (n: any): any => {
  if (!n || n.type != "NewExpression") return;
  if (n.callee?.type != "Identifier" || !n.typeArguments?.params?.length) return;
  return {
    type: "TSTypeReference",
    typeName: n.callee,
    typeArguments: n.typeArguments
  };
};

const inferFromExpression = (n: any): any =>
  inferLiteralType(n) || inferNewExpressionType(n);

const inferEnumType = (n: any): string => {
  let hasString = false;
  let hasNumber = false;
  for (const member of n.members) {
    const init = member.initializer;
    if (!init) {
      hasNumber = true; // auto-increment
    } else if (
      init.type === "StringLiteral" ||
      (init.type === "Literal" && typeof init.value === "string")
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
    if (n.loc) err.loc = n.loc;
    if (n.start != null) err.start = n.start;
    if (n.end != null) err.end = n.end;
    throw err;
  }
  return hasString ? "string" : "number";
};

export { inferEnumType, inferFromExpression };

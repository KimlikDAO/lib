import { ObjectExpression, Property } from "acorn";

const getPropertyKey = (prop: Property): string => {
  if (prop.key.type == "Identifier")
    return prop.key.name;
  if (prop.key.type == "Literal")
    return String(prop.key.value);
  throw new Error(`Expected object literal key, got ${prop.key.type}`);
};

const serializeObjectExpressionWithLiteralKeys = (
  objectExpression: ObjectExpression,
  sourceCode: string
): string =>
  "{\n  " + objectExpression.properties
    .map((prop) => {
      if (prop.type !== "Property")
        throw new Error(`Expected Property, got ${prop.type}`);
      const key = getPropertyKey(prop);
      const value = prop.shorthand
        ? key
        : sourceCode.slice(prop.value.start, prop.value.end);
      return `"${key}": ${value}`;
    })
    .join(",\n  ") + "\n}";

export { serializeObjectExpressionWithLiteralKeys };

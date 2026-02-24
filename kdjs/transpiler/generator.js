import { generate as generateAstring } from "astring";

/** @param {acorn.ExportNamedDeclaration} node */
const generateExport = (node) => {
  if (!node.specifiers || node.specifiers.length == 0) return "";
  const entries = node.specifiers.map((s) => "  " + s.exported.name).join(",\n");
  return "export {\n" + entries + "\n};\n";
};

const generate = (node) =>
  node.type === "ArrowFunctionExpression" ? generateArrowFunction(node) : generateAstring(node);

/**
 * Arrow function with single expression body only (no block {}).
 * @param {acorn.ArrowFunctionExpression} node
 * @return {string}
 */
const generateArrowFunction = (node) => {
  const params = (node.params || []).map((p) => (p.type === "Identifier" ? p.name : "")).filter(Boolean);
  return "(" + params.join(", ") + ") => " + generateAsExpression(node.body);
};

/**
 * Enum value type (number vs string) is not on the AST; we infer it from member initializers.
 *
 * @param {acorn.TSEnumDeclaration} node
 * @param {string=} namespace
 * @return {string} Enum in GCC format
 */
const generateEnum = (node, namespace) => {
  const enumName = node.id.name;
  const fullName = namespace ? `${namespace}.${enumName}` : `const ${enumName}`;
  const members = (node.members || []).map((member, index) => {
    const key = member.id.name;
    const value = member.initializer
      ? (member.initializer.value != null
          ? member.initializer.value
          : member.initializer.name)
      : index;
    return { key, value };
  });
  const hasString = members.some((m) => typeof m.value === "string");
  const enumType = hasString ? "string" : "number";
  const entries = members
    .map((m) => {
      const val = typeof m.value === "string" ? JSON.stringify(m.value) : String(m.value);
      return "  " + m.key + ": " + val;
    })
    .join(",\n");
  return "/** @enum {" + enumType + "} */\n"
    + fullName + " = {\n" + entries + "\n};\n";
};

/**
 * @param {acorn.TSTypeAliasDeclaration} node
 * @param {string} namespace The namespace name
 * @param {Map<string, string>=} typeMap
 * @return {string} The transpiled type alias content
 */
const generateTypedef = (node, namespace, typeMap) => {
  const typeName = node.id.name;
  const fullName = namespace ? `${namespace}.${typeName}` : `const ${typeName} = {}`;
  const typeText = generateTypeExpr(node.typeAnnotation, typeMap);
  let output = "";
  output += `/** @typedef {${typeText}} */\n`;
  output += `${fullName};\n\n`;
  return output;
};

const generateAsExpression = (node) =>
  `/** @type {${generateTypeExpr(node.typeAnnotation)}} */(${generateTypeExpr(node.expression)})`;

/**
 * @param {acorn.TSType} typeNode
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateTypeExpr = (typeNode, typeMap) => {
  if (!typeNode) return "unknown";

  switch (typeNode.type) {
    case "TSStringKeyword":
      return "string";
    case "TSNumberKeyword":
      return "number";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSBigIntKeyword":
      return "bigint";
    case "TSAnyKeyword":
      return "any";
    case "TSUnknownKeyword":
      return "unknown";
    case "TSVoidKeyword":
      return "void";
    case "TSNullKeyword":
      return "null";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSObjectKeyword":
      return "Object";
    case "TSArrayType":
      return `${generateTypeExpr(typeNode.elementType, typeMap)}[]`;
    case "TSParenthesizedType":
      return `(${generateTypeExpr(typeNode.typeAnnotation, typeMap)})`;
    case "TSTypeOperator":
      return `${typeNode.operator} ${generateTypeExpr(typeNode.typeAnnotation, typeMap)}`;
    case "TSQualifiedName":
      return `${generateTypeExpr(typeNode.left, typeMap)}.${typeNode.right.name}`;
    case "Identifier":
      return typeMap?.get(typeNode.name) || typeNode.name;
    case "TSTypeReference":
      let baseType = generateTypeExpr(typeNode.typeName, typeMap);
      const genericParams = typeNode.typeArguments || typeNode.typeParameters;
      if (genericParams && genericParams.params && genericParams.params.length > 0) {
        const typeParams = genericParams.params
          .map(param => generateTypeExpr(param, typeMap))
          .join(", ");
        return `${baseType}<${typeParams}>`;
      }
      return `${baseType}`;
    case "TSUnionType":
      return typeNode.types.map(t => generateTypeExpr(t, typeMap)).join("|");
    case "TSLiteralType":
      return typeof typeNode.literal.value;
    case "TSTypeLiteral": {
      const members = typeNode.members || [];
      const parts = members.map(member => {
        if (member.type !== "TSPropertySignature") return "";
        const key = member.key?.name ?? member.key?.value ?? "";
        const type = generateTypeExpr(member.typeAnnotation?.typeAnnotation, typeMap)
        const optional = member.optional ? "?" : "";
        return key ? `${key}${optional}: ${type}` : "";
      }).filter(Boolean);
      return `{ ${parts.join(", ")} }`;
    }
    case "TSFunctionType": {
      const params = typeNode.parameters || [];
      const paramParts = params.map(param => {
        const name = param.name ? (param.name.name ?? param.name) : "";
        let type = generateTypeExpr(param.typeAnnotation?.typeAnnotation, typeMap)
        const optional = param.optional ? "?" : "";
        return name ? `${name}${optional}: ${type}` : type + (param.optional ? "=" : "");
      });
      let returnType = generateTypeExpr(typeNode.typeAnnotation?.typeAnnotation, typeMap);
      return `(${paramParts.join(", ")}) => ${returnType}`;
    }
    default:
      return "unknown";
  }
};

export {
  generate,
  generateArrowFunction,
  generateEnum,
  generateExport,
  generateTypedef,
  generateTypeExpr
};

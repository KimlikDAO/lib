import { generate as generateAstring } from "astring";

/** Expression generators: only node types that can appear as an expression. */
const expressionGenerators = {
  ArrowFunctionExpression(node, typeMap) {
    const params = (node.params || []).map((p) => (p.type === "Identifier" ? p.name : "")).filter(Boolean);
    const body =
      node.body.type === "BlockStatement"
        ? generateBlock(node.body, typeMap, "  ")
        : generateExpression(node.body, typeMap);
    return "(" + params.join(", ") + ") => " + body;
  },
  TSAsExpression(node, typeMap) {
    return `/** @type {${generateTypeExpr(node.typeAnnotation, typeMap)}} */(${generateExpression(node.expression, typeMap)})`;
  },
  TSTypeAssertion(node, typeMap) {
    return `/** @type {${generateTypeExpr(node.typeAnnotation, typeMap)}} */(${generateExpression(node.expression, typeMap)})`;
  },
  CallExpression(node, typeMap) {
    const callee = generateExpression(node.callee, typeMap);
    const args = (node.arguments || []).map(arg => generateExpression(arg, typeMap));
    return callee + "(" + args.join(", ") + ")";
  },
  MemberExpression(node, typeMap) {
    const obj = generateExpression(node.object, typeMap);
    const prop = node.computed
      ? "[" + generateExpression(node.property, typeMap) + "]"
      : "." + (node.property?.name ?? "");
    return obj + prop;
  },
  ObjectExpression(node, typeMap) {
    const props = (node.properties || []).map(prop => {
      if (prop.type === "SpreadElement")
        return "..." + generateExpression(prop.argument, typeMap);
      const key = prop.key?.name ?? (prop.key ? generateExpression(prop.key, typeMap) : "");
      const value = prop.value ? generateExpression(prop.value, typeMap) : "";
      return prop.shorthand ? key : key + ": " + value;
    });
    return "{ " + props.join(", ") + " }";
  },
  Identifier(node) {
    return node.name ?? "";
  },
};

/**
 * @param {acorn.Expression} node
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateExpression = (node, typeMap) => {
  const f = expressionGenerators[node.type];
  if (f) return f(node, typeMap);
  return generateAstring(node);
};

/** Statement generators: serialize statement nodes to kdjs-js with ts-like JSDoc where needed. */
const statementGenerators = {
  VariableDeclaration(node, typeMap) {
    const lines = [];
    const kind = node.kind;
    const tag = kind === "const" ? "const" : "type";
    for (const decl of node.declarations || []) {
      const name = decl.id?.type === "Identifier" ? decl.id.name : null;
      if (name == null) continue;
      const typeNode = decl.id.typeAnnotation?.typeAnnotation;
      const typeStr = typeNode ? generateTypeExpr(typeNode, typeMap) : "";
      if (typeStr)
        lines.push(`/** @${tag} {${typeStr}} */`);
      const init = decl.init ? generateExpression(decl.init, typeMap) : "";
      lines.push(init ? `${kind} ${name} = ${init};` : `${kind} ${name};`);
    }
    return lines.join("\n");
  },
  ExpressionStatement(node, typeMap) {
    return generateExpression(node.expression, typeMap) + ";";
  },
  ReturnStatement(node, typeMap) {
    if (!node.argument) return "return;";
    return "return " + generateExpression(node.argument, typeMap) + ";";
  },
};

/**
 * @param {acorn.Statement} node
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateStatement = (node, typeMap) => {
  const f = statementGenerators[node.type];
  if (f) return f(node, typeMap);
  return generateAstring(node);
};

/**
 * @param {acorn.BlockStatement} blockNode
 * @param {Map<string, string>=} typeMap
 * @param {string} indent Inner indentation (e.g. "    " for method body)
 * @param {string} closingIndent Indentation for closing brace (defaults to indent)
 * @return {string}
 */
const generateBlock = (blockNode, typeMap, indent = "  ", closingIndent = undefined) => {
  const close = closingIndent !== undefined ? closingIndent : indent;
  if (!blockNode || blockNode.type !== "BlockStatement" || !blockNode.body)
    return "{}";
  const inner = blockNode.body
    .map(stmt => indent + generateStatement(stmt, typeMap))
    .join("\n");
  return inner ? `{\n${inner}\n${close}}` : "{}";
};

/** @param {acorn.ExportNamedDeclaration} node */
const generateExport = (node) => {
  if (!node.specifiers || node.specifiers.length == 0) return "";
  const entries = node.specifiers.map((s) => "  " + s.exported.name).join(",\n");
  return "export {\n" + entries + "\n};\n";
};

/** @param {acorn.ImportDeclaration} node */
const generateImport = (node) => {
  if (!node.specifiers || node.specifiers.length === 0)
    return `import "${node.source.value}";\n`;
  const defaultSpec = node.specifiers.find(s => s.type === "ImportDefaultSpecifier");
  const namedSpecs = node.specifiers.filter(s => s.type !== "ImportDefaultSpecifier");
  const defaultPart = defaultSpec ? defaultSpec.local.name : null;
  const namespaceSpec = namedSpecs.find(s => s.type === "ImportNamespaceSpecifier");
  const namedOnly = namedSpecs.filter(s => s.type !== "ImportNamespaceSpecifier");
  const namedParts = namedOnly.map(s =>
    s.imported.name === s.local.name ? s.local.name : `${s.imported.name} as ${s.local.name}`
  );
  const source = node.source.value;
  if (defaultPart && namedSpecs.length === 0)
    return `import ${defaultPart} from "${source}";\n`;
  if (namespaceSpec && namedOnly.length === 0 && !defaultPart)
    return `import * as ${namespaceSpec.local.name} from "${source}";\n`;
  if (defaultPart && namespaceSpec && namedOnly.length === 0)
    return `import ${defaultPart}, * as ${namespaceSpec.local.name} from "${source}";\n`;
  if (defaultPart && namedParts.length > 0)
    return `import ${defaultPart}, { ${namedParts.join(", ")} } from "${source}";\n`;
  if (defaultPart && namespaceSpec)
    return `import ${defaultPart}, * as ${namespaceSpec.local.name} from "${source}";\n`;
  return `import { ${namedParts.join(", ")} } from "${source}";\n`;
};

/** Top-level: delegate to expression for init RHS, or use for future statement table. */
const generate = (node, typeMap) => generateExpression(node, typeMap);

/**
 * Enum value type (number vs string) is not on the AST; we infer it from member initializers.
 *
 * @param {acorn.TSEnumDeclaration} node
 * @param {Map<string, string>=} typeMap
 * @return {string} Enum in GCC format
 */
const generateEnum = (node, typeMap) => {
  const enumName = node.id.name;
  const resolvedName = typeMap?.get(enumName);
  const statement = resolvedName ?? `const ${enumName}`;
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
    + statement + " = {\n" + entries + "\n};\n";
};

/**
 * @param {acorn.TSTypeAliasDeclaration} node
 * @param {Map<string, string>=} typeMap
 * @return {string} The transpiled type alias content
 */
const generateTypedef = (node, typeMap) => {
  const shortName = node.id.name;
  const resolvedName = typeMap?.get(shortName);
  const statement = resolvedName ?? `const ${shortName} = {}`;
  const typeText = generateTypeExpr(node.typeAnnotation, typeMap);
  let output = "";
  output += `/** @typedef {${typeText}} */\n`;
  output += `${statement};\n\n`;
  return output;
};

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

/**
 * Serializes a TypeScript interface into a GCC interface definition.
 *
 * @param {acorn.TSInterfaceDeclaration} node The interface declaration node
 * @param {string} namespace The namespace name
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The transpiled interface content
 */
const generatePrototypeInterface = (node, typeMap) => {
  const fullName = typeMap?.get(node.id.name) ?? node.id.name;
  const statement = typeMap?.get(node.id.name) ?? `const ${node.id.name}`;
  let output = "";
  output += `/**\n`;
  output += ` * @struct\n`;
  output += ` * @interface\n`;
  if (node.extends && node.extends.length > 0) {
    for (const extendedInterface of node.extends) {
      const extendsName = generateTypeExpr(extendedInterface.expression, typeMap);
      output += ` * @extends {${extendsName}}\n`;
    }
  }
  output += ` */\n`;
  output += `${statement} = function () {};\n\n`;

  if (!node.body || !node.body.body)
    return output;
  for (const member of node.body.body) {
    if (member.type == "TSPropertySignature") {
      const propertyName = member.key.name || member.key.value;
      const typeText = generateTypeExpr(member.typeAnnotation?.typeAnnotation, typeMap);
      const finalType = typeText + (member.optional ? " | undefined" : "");
      const annotation = member.readonly ? "const" : "type";
      output += `/** @${annotation} {${finalType}} */\n`;
      output += `${fullName}.prototype.${propertyName};\n\n`;
    } else if (member.type == "TSMethodSignature") {
      const methodName = member.key.name || member.key.value;
      const params = member.parameters || [];
      const paramDocs = params.map(param => getNameType(param, typeMap));
      const returnType = generateTypeExpr(member.typeAnnotation?.typeAnnotation, typeMap);
      output += `/**\n`;
      for (const paramDoc of paramDocs)
        output += ` * @param {${paramDoc.type}} ${paramDoc.name}\n`;
      output += ` * @return {${returnType}}\n`;
      output += ` */\n`;
      const paramNames = params.map(p => p.name ? p.name.name || p.name : "");
      output += `${fullName}.prototype.${methodName} = function (${paramNames.join(", ")}) {};\n\n`;
    }
  }
  return output;
};

/**
 * Serializes a TypeScript interface into a GCC class-syntax interface definition.
 * Properties become constructor field declarations; methods become class methods.
 * The first `extends` clause goes on the class declaration; any additional ones
 * become `@extends` JSDoc annotations.
 *
 * @param {acorn.TSInterfaceDeclaration} node
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateClassInterface = (node, typeMap) => {
  const resolvedName = typeMap?.get(node.id.name);
  const extendsNodes = node.extends || [];
  const members = node.body?.body || [];
  const properties = members.filter(m => m.type === "TSPropertySignature");
  const methods = members.filter(m => m.type === "TSMethodSignature");

  let output = `/**\n * @interface\n`;
  for (let i = 1; i < extendsNodes.length; i++)
    output += ` * @extends {${generateTypeExpr(extendsNodes[i].expression, typeMap)}}\n`;
  output += ` */\n`;

  const extendsClause = extendsNodes.length > 0
    ? ` extends ${generateTypeExpr(extendsNodes[0].expression, typeMap)}`
    : "";
  const classDecl = resolvedName
    ? `${resolvedName} = class${extendsClause}`
    : `class ${node.id.name}${extendsClause}`;
  output += `${classDecl} {\n`;

  if (properties.length > 0) {
    output += `  constructor() {\n`;
    for (const member of properties) {
      const propertyName = member.key.name || member.key.value;
      const typeText = generateTypeExpr(member.typeAnnotation?.typeAnnotation, typeMap);
      const finalType = typeText + (member.optional ? " | undefined" : "");
      const annotation = member.readonly ? "const" : "type";
      output += `    /** @${annotation} {${finalType}} */\n`;
      output += `    this.${propertyName};\n`;
    }
    output += `  }\n`;
  }

  for (const member of methods) {
    const methodName = member.key.name || member.key.value;
    const params = member.parameters || [];
    const paramDocs = params.map(param => getNameType(param, typeMap));
    const returnType = generateTypeExpr(member.typeAnnotation?.typeAnnotation, typeMap);
    output += `  /**\n`;
    for (const paramDoc of paramDocs)
      output += `   * @param {${paramDoc.type}} ${paramDoc.name}\n`;
    if (returnType)
      output += `   * @return {${returnType}}\n`;
    output += `   */\n`;
    const paramNames = params.map(p => getParamNameString(p));
    output += `  ${methodName}(${paramNames.join(", ")}) {}\n`;
  }

  output += `}\n`;
  return output;
};

/**
 * Normalize parameter name to a string. AST can have param.name as Identifier object or string.
 * @param {acorn.TSParameterDeclaration|acorn.Identifier} paramOrInner
 * @return {string}
 */
const getParamNameString = (paramOrInner) => {
  const inner = paramOrInner?.type === "TSParameterProperty" ? paramOrInner.parameter : paramOrInner;
  if (!inner) return "";
  if (typeof inner.name === "string") return inner.name;
  if (inner.name && typeof inner.name === "object" && typeof inner.name.name === "string")
    return inner.name.name;
  return "";
};

/**
 * Processes a parameter node.
 *
 * @param {acorn.TSParameterDeclaration} param The parameter node
 * @param {Map<string, string>} typeMap Map of type names to namespaces
 * @return {{ name: string, type: string }} The parameter name and type
 */
const getNameType = (param, typeMap) => {
  const inner = param.type === "TSParameterProperty" ? param.parameter : param;
  const name = getParamNameString(inner || param);
  let type = "unknown";
  if (inner?.typeAnnotation)
    type = generateTypeExpr(inner.typeAnnotation.typeAnnotation, typeMap);
  if (inner?.optional)
    type += "=";
  return { name, type };
};

/**
 * Serializes a ClassDeclaration (or class with real bodies) to kdjs class with JSDoc.
 * Uses generateBlock for method bodies so statements and expressions are in ts-in-jsdoc style.
 *
 * @param {acorn.ClassDeclaration} node
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateClassDeclaration = (node, typeMap) => {
  const className = node.id?.name ?? "";
  const extendsClause = node.superClass
    ? " extends " + generateExpression(node.superClass, typeMap)
    : "";
  const implementsDoc = (node.implements || []).length > 0
    ? node.implements
        .map(impl => ` * @implements {${generateTypeExpr(impl.expression, typeMap)}}\n`)
        .join("")
    : "";
  let output = "";
  if (implementsDoc)
    output += `/**\n${implementsDoc} */\n`;
  output += `class ${className}${extendsClause} {\n`;

  const body = node.body?.body || [];
  for (const member of body) {
    if (member.type !== "MethodDefinition")
      continue;
    const key = member.key;
    const methodName = key?.name ?? (key?.type === "Identifier" ? key.name : "");
    const value = member.value;
    const params = value.params || [];
    const paramNames = params.map(p => {
      const inner = p.type === "TSParameterProperty" ? p.parameter : p;
      if (inner?.type === "Identifier") return inner.name ?? "";
      if (inner?.name) return inner.name.name ?? inner.name;
      return "";
    });
    const paramDocs = params.map(p => getNameType(p, typeMap));
    const returnTypeNode = value.returnType?.typeAnnotation;
    const returnType = returnTypeNode ? generateTypeExpr(returnTypeNode, typeMap) : "void";

    output += `  /**\n`;
    for (const paramDoc of paramDocs)
      if (paramDoc.name)
        output += `   * @param {${paramDoc.type}} ${paramDoc.name}\n`;
    if (returnType)
      output += `   * @return {${returnType}}\n`;
    output += `   */\n`;
    const methodHead = methodName + "(" + paramNames.join(", ") + ")";
    const block = value.body ? generateBlock(value.body, typeMap, "    ", "  ") : "{}";
    output += `  ${methodHead} ${block}\n`;
  }

  output += `}\n`;
  return output;
};

export {
  generate,
  generateBlock,
  generateClassDeclaration,
  generateClassInterface,
  generateEnum,
  generateExport,
  generateExpression,
  generateImport,
  generatePrototypeInterface,
  generateStatement,
  generateTypedef,
  generateTypeExpr,
};

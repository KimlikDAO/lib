const INDENT = "  ";

/** Expression generators: only node types that can appear as an expression. */
const expressionGenerators = {
  ArrowFunctionExpression(node, typeMap, indent) {
    const params = (node.params || []).map((p) => (p.type == "Identifier" ? p.name : "")).filter(Boolean);
    const body =
      node.body.type == "BlockStatement"
        ? generateBlock(node.body, typeMap, INDENT)
        : generateExpression(node.body, typeMap, indent);
    return "(" + params.join(", ") + ") => " + body;
  },
  TSAsExpression(node, typeMap, indent) {
    return `/** @type {${generateTypeExpr(node.typeAnnotation, typeMap)}} */(${generateExpression(node.expression, typeMap, indent)})`;
  },
  TSTypeAssertion(node, typeMap, indent) {
    return `/** @type {${generateTypeExpr(node.typeAnnotation, typeMap)}} */(${generateExpression(node.expression, typeMap, indent)})`;
  },
  CallExpression(node, typeMap, indent) {
    const callee = generateExpression(node.callee, typeMap, indent);
    const args = (node.arguments || []).map(arg => generateExpression(arg, typeMap, indent));
    return callee + "(" + args.join(", ") + ")";
  },
  MemberExpression(node, typeMap, indent) {
    const obj = generateExpression(node.object, typeMap, indent);
    const prop = node.computed
      ? "[" + generateExpression(node.property, typeMap, indent) + "]"
      : "." + (node.property?.name ?? "");
    return obj + prop;
  },
  ObjectExpression(node, typeMap, indent) {
    const props = (node.properties || []).map(prop => {
      if (prop.type == "SpreadElement")
        return "..." + generateExpression(prop.argument, typeMap, indent);
      const key = prop.key?.name ?? (prop.key ? generateExpression(prop.key, typeMap, indent) : "");
      const value = prop.value ? generateExpression(prop.value, typeMap, indent) : "";
      return prop.shorthand ? key : key + ": " + value;
    });
    return "{ " + props.join(", ") + " }";
  },
  Identifier(node) {
    return node.name ?? "";
  },
  ThisExpression() {
    return "this";
  },
  Literal(node) {
    if (node.value === null) return "null";
    if (typeof node.value == "number") return String(node.value);
    if (typeof node.value == "boolean") return node.value ? "true" : "false";
    if (typeof node.value == "string") return JSON.stringify(node.value);
    if (node.raw != null) return node.raw;
    return String(node.value);
  },
  BinaryExpression(node, typeMap, indent) {
    const left = generateExpression(node.left, typeMap, indent);
    const right = generateExpression(node.right, typeMap, indent);
    return left + " " + node.operator + " " + right;
  },
  LogicalExpression(node, typeMap, indent) {
    const left = generateExpression(node.left, typeMap, indent);
    const right = generateExpression(node.right, typeMap, indent);
    return left + " " + node.operator + " " + right;
  },
  UnaryExpression(node, typeMap, indent) {
    const arg = generateExpression(node.argument, typeMap, indent);
    return node.prefix ? node.operator + arg : arg + node.operator;
  },
  UpdateExpression(node, typeMap, indent) {
    const arg = generateExpression(node.argument, typeMap, indent);
    return node.prefix ? node.operator + arg : arg + node.operator;
  },
  ConditionalExpression(node, typeMap, indent) {
    const test = generateExpression(node.test, typeMap, indent);
    const cons = generateExpression(node.consequent, typeMap, indent);
    const alt = generateExpression(node.alternate, typeMap, indent);
    return test + " ? " + cons + " : " + alt;
  },
  AssignmentExpression(node, typeMap, indent) {
    const left = generateExpression(node.left, typeMap, indent);
    const right = generateExpression(node.right, typeMap, indent);
    return left + " " + node.operator + " " + right;
  },
  SequenceExpression(node, typeMap, indent) {
    const expr = (node.expressions || []).map(e => generateExpression(e, typeMap, indent)).join(", ");
    return "(" + expr + ")";
  },
  ArrayExpression(node, typeMap, indent) {
    const elts = (node.elements || []).map(el =>
      el == null ? "" : (el.type == "SpreadElement" ? "..." + generateExpression(el.argument, typeMap, indent) : generateExpression(el, typeMap, indent))
    );
    return "[" + elts.join(", ") + "]";
  },
  NewExpression(node, typeMap, indent) {
    const callee = generateExpression(node.callee, typeMap, indent);
    const args = (node.arguments || []).map(a => generateExpression(a, typeMap, indent));
    return "new " + callee + "(" + args.join(", ") + ")";
  },
  FunctionExpression(node, typeMap, indent) {
    const name = node.id?.name ? node.id.name + " " : "";
    const params = (node.params || []).map((p) => (p.type == "Identifier" ? p.name : "")).filter(Boolean);
    const body = node.body?.type == "BlockStatement"
      ? generateBlock(node.body, typeMap, INDENT)
      : "{}";
    return "function " + name + "(" + params.join(", ") + ") " + body;
  },
  AwaitExpression(node, typeMap, indent) {
    return "await " + generateExpression(node.argument, typeMap, indent);
  },
  TemplateLiteral(node, typeMap, indent) {
    const parts = [];
    const quasis = node.quasis || [];
    const exprs = node.expressions || [];
    for (let i = 0; i < quasis.length; i++) {
      const raw = (quasis[i].value?.raw ?? "").replace(/\\/g, "\\\\").replace(/`/g, "\\`");
      parts.push(raw);
      if (i < exprs.length)
        parts.push("${" + generateExpression(exprs[i], typeMap, indent) + "}");
    }
    return "`" + parts.join("") + "`";
  },
  TSNonNullExpression(node, typeMap, indent) {
    return generateExpression(node.expression, typeMap, indent);
  },
  OptionalMemberExpression(node, typeMap, indent) {
    const obj = generateExpression(node.object, typeMap, indent);
    const prop = node.computed
      ? "?.[" + generateExpression(node.property, typeMap, indent) + "]"
      : "?." + (node.property?.name ?? "");
    return obj + prop;
  },
  OptionalCallExpression(node, typeMap, indent) {
    const callee = generateExpression(node.callee, typeMap, indent);
    const args = (node.arguments || []).map(a => generateExpression(a, typeMap, indent));
    return callee + "?.(" + args.join(", ") + ")";
  },
  ChainExpression(node, typeMap, indent) {
    return generateExpression(node.expression, typeMap, indent);
  },
  ArrayPattern(node, typeMap, indent) {
    return generateBindingPattern(node, typeMap, indent);
  },
  ObjectPattern(node, typeMap, indent) {
    return generateBindingPattern(node, typeMap, indent);
  },
};

/**
 * Serialize a binding pattern (ArrayPattern, ObjectPattern, etc.) to source text.
 * Used for variable declarations and assignment LHS.
 *
 * @param {acorn.Node} node ArrayPattern | ObjectPattern | Identifier | RestElement | AssignmentPattern
 * @param {Map<string, string>=} typeMap
 * @param {string} indent
 * @return {string}
 */
const generateBindingPattern = (node, typeMap, indent = "") => {
  if (!node) return "";
  if (node.type == "Identifier")
    return node.name ?? "";
  if (node.type == "RestElement")
    return "..." + generateBindingPattern(node.argument, typeMap, indent);
  if (node.type == "AssignmentPattern") {
    const left = generateBindingPattern(node.left, typeMap, indent);
    const right = node.right ? generateExpression(node.right, typeMap, indent) : "";
    return right ? left + " = " + right : left;
  }
  if (node.type == "ArrayPattern") {
    const elts = (node.elements || []).map(el =>
      el == null ? "" : generateBindingPattern(el, typeMap, indent)
    );
    return "[" + elts.join(", ") + "]";
  }
  if (node.type == "ObjectPattern") {
    const props = (node.properties || []).map(prop => {
      if (prop.type == "RestElement")
        return "..." + generateBindingPattern(prop.argument, typeMap, indent);
      const key = prop.key?.name ?? (prop.key?.value != null ? JSON.stringify(prop.key.value) : (prop.computed ? generateExpression(prop.key, typeMap, indent) : ""));
      const value = prop.value ? generateBindingPattern(prop.value, typeMap, indent) : "";
      return prop.shorthand ? key : key + ": " + value;
    });
    return "{ " + props.join(", ") + " }";
  }
  return "";
};

/**
 * Indent all non-empty lines in `text` with `indent`.
 * @param {string} text
 * @param {string} indent
 * @return {string}
 */
const indentText = (text, indent) =>
  String(text)
    .split("\n")
    .map((line) => (line.length ? indent + line : line))
    .join("\n");

/**
 * Serialize init/left of a for-loop (VariableDeclaration without trailing semicolon, else expression).
 * @param {acorn.Node|null} node
 * @param {Map<string, string>=} typeMap
 * @param {string} indent
 * @return {string}
 */
const serializeForInit = (node, typeMap, indent) => {
  if (!node) return "";
  if (node.type != "VariableDeclaration")
    return generateExpression(node, typeMap, indent);
  const parts = (node.declarations || []).map((decl) => {
    const id = decl.id;
    const leftPart = id?.type == "Identifier" ? id.name : generateBindingPattern(id, typeMap, indent);
    if (!leftPart) return "";
    const init = decl.init ? generateExpression(decl.init, typeMap, indent) : "";
    return init ? `${leftPart} = ${init}` : leftPart;
  }).filter(Boolean);
  return parts.length ? `${node.kind} ${parts.join(", ")}` : node.kind;
};

/**
 * Format loop body: " {}", or " " + block, or newline + indented singleton statement.
 * @param {acorn.Statement|null} body
 * @param {Map<string, string>=} typeMap
 * @param {string} indent
 * @return {string}
 */
const formatLoopBody = (body, typeMap, indent) => {
  if (!body) return " {}";
  if (body.type == "BlockStatement")
    return " " + generateBlock(body, typeMap, INDENT);
  const inner = indent + INDENT;
  return "\n" + indentText(generateStatement(body, typeMap, inner), INDENT);
};

/**
 * @param {acorn.Expression} node
 * @param {Map<string, string>=} typeMap
 * @param {string} indent Current indent; recurse into inner blocks with indent + "  "
 * @return {string}
 */
const generateExpression = (node, typeMap, indent = "") => {
  const f = expressionGenerators[node.type];
  if (f) return f(node, typeMap, indent);
  throw new Error("Unsupported expression type: " + (node?.type ?? "null"));
};

/** Statement generators: serialize statement nodes to kdjs-js with ts-like JSDoc where needed. */
const statementGenerators = {
  VariableDeclaration(node, typeMap, indent = "") {
    const lines = [];
    const kind = node.kind;
    const tag = kind == "const" ? "const" : "type";
    for (const decl of node.declarations || []) {
      const id = decl.id;
      const leftPart = id?.type == "Identifier" ? id.name : generateBindingPattern(id, typeMap, indent);
      if (!leftPart) continue;
      const init = decl.init;
      const typeNode = id?.typeAnnotation?.typeAnnotation;
      const isFunctionInit = init?.type == "ArrowFunctionExpression" || init?.type == "FunctionExpression";
      const block =
        generateFunctionTypeJSDoc(id?.typeAnnotation || (isFunctionInit ? init : null), typeMap) ??
        (typeNode ? (() => {
          const typeStr = generateTypeExpr(typeNode, typeMap);
          return typeStr ? `/** @${tag} {${typeStr}} */` : "";
        })() : "");
      if (block)
        lines.push(block);
      const initCode = init ? generateExpression(init, typeMap, indent) : "";
      lines.push(initCode ? `${kind} ${leftPart} = ${initCode};` : `${kind} ${leftPart};`);
    }
    return lines.join("\n");
  },
  ExpressionStatement(node, typeMap, indent = "") {
    return generateExpression(node.expression, typeMap, indent) + ";";
  },
  ReturnStatement(node, typeMap, indent = "") {
    if (!node.argument) return "return;";
    return "return " + generateExpression(node.argument, typeMap, indent) + ";";
  },
  ForStatement(node, typeMap, indent = "") {
    const init = serializeForInit(node.init, typeMap, indent);
    const test = node.test ? generateExpression(node.test, typeMap, indent) : "";
    const update = node.update ? generateExpression(node.update, typeMap, indent) : "";
    const head = `for (${init}; ${test}; ${update})`;
    return head + formatLoopBody(node.body, typeMap, indent);
  },
  ForInStatement(node, typeMap, indent = "") {
    const left = serializeForInit(node.left, typeMap, indent);
    const right = node.right ? generateExpression(node.right, typeMap, indent) : "";
    const head = `for (${left} in ${right})`;
    return head + formatLoopBody(node.body, typeMap, indent);
  },
  ForOfStatement(node, typeMap, indent = "") {
    const awaitPart = node.await ? "await " : "";
    const left = serializeForInit(node.left, typeMap, indent);
    const right = node.right ? generateExpression(node.right, typeMap, indent) : "";
    const head = `for (${awaitPart}${left} of ${right})`;
    return head + formatLoopBody(node.body, typeMap, indent);
  },
  IfStatement(node, typeMap, indent = "") {
    const test = "if (" + generateExpression(node.test, typeMap, indent) + ")";
    const consequent = node.consequent;
    const inner = indent + INDENT;
    const consequentCode =
      consequent?.type == "BlockStatement"
        ? " " + generateBlock(consequent, typeMap, INDENT)
        : "\n" + indentText(generateStatement(consequent, typeMap, inner), INDENT);
    let out = test + consequentCode;
    if (node.alternate) {
      const alt = node.alternate;
      if (alt.type == "BlockStatement")
        out += " else " + generateBlock(alt, typeMap, INDENT);
      else
        out += "\nelse\n" + indentText(generateStatement(alt, typeMap, inner), INDENT);
    }
    return out;
  },
  EmptyStatement() {
    return "";
  },
  BlockStatement(node, typeMap, indent = "") {
    return generateBlock(node, typeMap, indent || INDENT);
  },
  BreakStatement(node) {
    return node.label ? "break " + node.label.name + ";" : "break;";
  },
  ContinueStatement(node) {
    return node.label ? "continue " + node.label.name + ";" : "continue;";
  },
  ThrowStatement(node, typeMap, indent) {
    return "throw " + generateExpression(node.argument, typeMap, indent) + ";";
  },
  WhileStatement(node, typeMap, indent = "") {
    const test = generateExpression(node.test, typeMap, indent);
    const head = "while (" + test + ")";
    return head + formatLoopBody(node.body, typeMap, indent);
  },
  DoWhileStatement(node, typeMap, indent = "") {
    const test = generateExpression(node.test, typeMap, indent);
    const body = node.body?.type == "BlockStatement"
      ? " " + generateBlock(node.body, typeMap, INDENT)
      : "\n" + indentText(generateStatement(node.body, typeMap, indent + INDENT), INDENT);
    return "do" + body + " while (" + test + ");";
  },
  SwitchStatement(node, typeMap, indent = "") {
    const discriminant = generateExpression(node.discriminant, typeMap, indent);
    let out = "switch (" + discriminant + ") {\n";
    const inner = indent + INDENT;
    const caseInner = inner + INDENT;
    const close = indent.length >= 2 ? indent.slice(2) : "";
    for (const c of node.cases || []) {
      out += inner + (c.test ? "case " + generateExpression(c.test, typeMap, indent) + ":" : "default:") + "\n";
      for (const stmt of c.consequent || [])
        out += indentText(generateStatement(stmt, typeMap, caseInner), caseInner) + "\n";
    }
    return out + close + "}";
  },
  TryStatement(node, typeMap, indent = "") {
    const inner = indent + INDENT;
    let out = "try " + generateBlock(node.block, typeMap, INDENT);
    if (node.handler) {
      const param = node.handler.param?.type == "Identifier" ? node.handler.param.name : "e";
      out += " catch (" + param + ") " + generateBlock(node.handler.body, typeMap, INDENT);
    }
    if (node.finalizer)
      out += " finally " + generateBlock(node.finalizer, typeMap, INDENT);
    return out;
  },
  LabeledStatement(node, typeMap, indent = "") {
    return node.label.name + ": " + generateStatement(node.body, typeMap, indent);
  },
  DebuggerStatement() {
    return "debugger;";
  },
};

/**
 * @param {acorn.Statement} node
 * @param {Map<string, string>=} typeMap
 * @param {string} indent Current indent; recurse into inner blocks with indent + "  "
 * @return {string}
 */
const generateStatement = (node, typeMap, indent = "") => {
  const f = statementGenerators[node.type];
  if (f) return f(node, typeMap, indent);
  throw new Error("Unsupported statement type: " + (node?.type ?? "null"));
};

/**
 * @param {acorn.BlockStatement} blockNode
 * @param {Map<string, string>=} typeMap
 * @param {string} indent Indent for block content; closing brace uses indent.slice(2)
 * @return {string}
 */
const generateBlock = (blockNode, typeMap, indent = INDENT) => {
  const close = indent.length >= 2 ? indent.slice(2) : "";
  if (!blockNode || blockNode.type != "BlockStatement" || !blockNode.body)
    return "{}";
  const inner = blockNode.body
    .map(stmt => indentText(generateStatement(stmt, typeMap, indent), indent))
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
  if (!node.specifiers || node.specifiers.length == 0)
    return `import "${node.source.value}";\n`;
  const defaultSpec = node.specifiers.find(s => s.type == "ImportDefaultSpecifier");
  const namedSpecs = node.specifiers.filter(s => s.type != "ImportDefaultSpecifier");
  const defaultPart = defaultSpec ? defaultSpec.local.name : null;
  const namespaceSpec = namedSpecs.find(s => s.type == "ImportNamespaceSpecifier");
  const namedOnly = namedSpecs.filter(s => s.type != "ImportNamespaceSpecifier");
  const namedParts = namedOnly.map(s =>
    s.imported.name == s.local.name ? s.local.name : `${s.imported.name} as ${s.local.name}`
  );
  const source = node.source.value;
  if (defaultPart && namedSpecs.length == 0)
    return `import ${defaultPart} from "${source}";\n`;
  if (namespaceSpec && namedOnly.length == 0 && !defaultPart)
    return `import * as ${namespaceSpec.local.name} from "${source}";\n`;
  if (defaultPart && namespaceSpec && namedOnly.length == 0)
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
  const hasString = members.some((m) => typeof m.value == "string");
  const enumType = hasString ? "string" : "number";
  const entries = members
    .map((m) => {
      const val = typeof m.value == "string" ? JSON.stringify(m.value) : String(m.value);
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
        if (member.type != "TSPropertySignature") return "";
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
 * Returns multi-line JSDoc (@param, @return) for a function type using only AST (typeAnnotation).
 * No typeExpression / parallel tree. Use for const f: (x: number) => string or const f = (x: number): string => ...
 * Modifiers (@noinline etc.) are not emitted; reserved for future unification with the type tree.
 *
 * @param {acorn.TSTypeAnnotation|acorn.TSFunctionType|acorn.ArrowFunctionExpression|acorn.FunctionExpression} node
 * @param {Map<string, string>=} typeMap
 * @return {string|null} JSDoc block for the function type, or null if node is not a function type
 */
const generateFunctionTypeJSDoc = (node, typeMap) => {
  if (!node) return null;
  let parameters = [];
  let returnTypeNode = null;

  const typeAnn = node.type == "TSTypeAnnotation" ? node.typeAnnotation : node;
  if (typeAnn?.type == "TSFunctionType") {
    parameters = typeAnn.parameters || [];
    returnTypeNode = typeAnn.typeAnnotation?.typeAnnotation;
  } else if (
    node.type == "ArrowFunctionExpression" ||
    node.type == "FunctionExpression"
  ) {
    parameters = node.params || [];
    returnTypeNode = node.returnType?.typeAnnotation;
  } else if (node?.type == "TSTypeAnnotation") {
    return generateFunctionTypeJSDoc(node.typeAnnotation, typeMap);
  } else {
    return null;
  }

  const lines = [];
  const lastIdx = parameters.length - 1;
  for (let i = 0; i < parameters.length; i++) {
    const param = parameters[i];
    const name =
      param.type == "RestElement"
        ? (param.argument?.name ?? "rest")
        : (param.name?.name ?? param.name ?? "arg" + i);
    if (param.type == "RestElement") {
      const restType = generateTypeExpr(param.argument?.typeAnnotation?.typeAnnotation, typeMap);
      lines.push(` * @param {...${restType || "unknown"}} ${name}`);
    } else {
      const typeStr = generateTypeExpr(param.typeAnnotation?.typeAnnotation, typeMap);
      const optional = param.optional ? "=" : "";
      lines.push(` * @param {${typeStr}${optional}} ${name}`);
    }
  }
  const returnTypeStr = returnTypeNode ? generateTypeExpr(returnTypeNode, typeMap) : "void";
  lines.push(` * @return {${returnTypeStr}}`);
  return "/**\n" + lines.join("\n") + "\n */";
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
      output += emitMethodJSDoc(paramDocs, returnType, " * ") + "\n";
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
  const properties = members.filter(m => m.type == "TSPropertySignature");
  const methods = members.filter(m => m.type == "TSMethodSignature");

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
    output += "  " + emitMethodJSDoc(paramDocs, returnType, "   * ") + "\n";
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
  const inner = paramOrInner?.type == "TSParameterProperty" ? paramOrInner.parameter : paramOrInner;
  if (!inner) return "";
  if (typeof inner.name == "string") return inner.name;
  if (inner.name && typeof inner.name == "object" && typeof inner.name.name == "string")
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
  const inner = param.type == "TSParameterProperty" ? param.parameter : param;
  const name = getParamNameString(inner || param);
  let type = "unknown";
  if (inner?.typeAnnotation)
    type = generateTypeExpr(inner.typeAnnotation.typeAnnotation, typeMap);
  if (inner?.optional)
    type += "=";
  return { name, type };
};

/**
 * Build method JSDoc block from param docs and return type.
 * @param {{ name: string, type: string }[]} paramDocs
 * @param {string|null} returnType Omit @return when null/empty
 * @param {string} linePrefix Prefix for each line (e.g. "   * " or " * ")
 * @return {string}
 */
const emitMethodJSDoc = (paramDocs, returnType, linePrefix = " * ") => {
  const lines = [];
  for (const p of paramDocs || [])
    if (p.name)
      lines.push(`${linePrefix}@param {${p.type}} ${p.name}`);
  if (returnType)
    lines.push(`${linePrefix}@return {${returnType}}`);
  const close = linePrefix.replace(/\*\s*$/, "*/");
  return "/**\n" + lines.join("\n") + "\n" + close;
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
    if (member.type != "MethodDefinition")
      continue;
    const key = member.key;
    const methodName = key?.name ?? (key?.type == "Identifier" ? key.name : "");
    const value = member.value;
    const params = value.params || [];
    const paramNames = params.map(p => getParamNameString(p));
    const paramDocs = params.map(p => getNameType(p, typeMap));
    const returnTypeNode = value.returnType?.typeAnnotation;
    const returnType = returnTypeNode ? generateTypeExpr(returnTypeNode, typeMap) : "void";

    output += "  " + emitMethodJSDoc(paramDocs, returnType, "   * ") + "\n";
    const methodHead = methodName + "(" + paramNames.join(", ") + ")";
    const block = value.body ? generateBlock(value.body, typeMap, "    ") : "{}";
    output += `  ${methodHead} ${block}\n`;
  }

  output += `}\n`;
  return output;
};

/**
 * Program-body generators: one entry per AST node type that can appear in Program.body.
 * Dispatches to the right serializer so the transpiler does not need to switch on node type.
 *
 * @param {acorn.Node} node Any Program.body element (import, declaration, statement, etc.)
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateProgramBody = (node, typeMap) => {
  const type = node?.type;
  if (!type) return "";

  if (type == "ImportDeclaration")
    return generateImport(node);
  if (type == "TSEnumDeclaration") {
    if (!node.const) throw new Error("Only const enum is allowed");
    return generateEnum(node, typeMap);
  }
  if (type == "TSTypeAliasDeclaration")
    return "\n" + generateTypedef(node, typeMap);
  if (type == "TSInterfaceDeclaration")
    return generateClassInterface(node, typeMap);
  if (type == "ClassDeclaration")
    return generateClassDeclaration(node, typeMap);
  if (type == "VariableDeclaration")
    return generateStatement(node, typeMap) + "\n";
  if (type == "ExportNamedDeclaration")
    return "\n" + generateExport(node);
  if (type.endsWith("Statement"))
    return generateStatement(node, typeMap) + "\n";

  return "";
};

/**
 * Serialize a full program AST (module or script) to kdjs-js.
 * @param {acorn.Program} ast Parsed program (ast.body is the top-level list)
 * @param {Map<string, string>=} typeMap
 * @return {string}
 */
const generateProgram = (ast, typeMap) => {
  let out = "";
  for (const node of ast?.body || [])
    out += generateProgramBody(node, typeMap);
  return out;
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
  generateProgramBody,
  generateProgram,
  generatePrototypeInterface,
  generateStatement,
  generateTypedef,
  generateTypeExpr,
};

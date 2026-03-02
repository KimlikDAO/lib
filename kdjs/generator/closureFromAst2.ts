/**
 * closureFromAst2: kdjs AST → JS string generator (spec-aligned structure).
 *
 * Three categories, each with an object dispatcher:
 * - generateExpression(node, context) — expression generators
 * - generateTypeExpr(node, typeMap) — typeExpr generators (for JSDoc type strings)
 * - generateStatement(node, context) — statement generators
 *
 * Context carries: indent, typeMap, parent (for precedence), isRightHand (for associativity).
 */

import {
  generateClassDeclaration,
  generateClassInterface,
  generateEnum,
  generateTypedef,
} from "./closureFromAst";

/** Context passed through generation. Parent + isRightHand used later for precedence-aware parens. */
export interface GenerateContext {
  indent?: string;
  typeMap?: Map<string, string>;
  /** Parent node when emitting a child expression (for parens). */
  parent?: ESTreeNode;
  /** True when this expression is the right operand of a binary/logical expression. */
  isRightHand?: boolean;
}

/** Minimal ESTree-like node (acorn/TypeScript parser output). Explicit optional props allow dot access. */
export interface ESTreeNode {
  type: string;
  // Expression / type nodes
  name?: string;
  value?: unknown;
  raw?: string;
  operator?: string;
  prefix?: boolean;
  left?: ESTreeNode;
  right?: ESTreeNode;
  argument?: ESTreeNode;
  arguments?: ESTreeNode[];
  callee?: ESTreeNode;
  object?: ESTreeNode;
  property?: ESTreeNode;
  test?: ESTreeNode;
  consequent?: ESTreeNode | ESTreeNode[];
  alternate?: ESTreeNode;
  expressions?: ESTreeNode[];
  elements?: (ESTreeNode | null)[];
  properties?: ESTreeNode[];
  expression?: ESTreeNode;
  quasis?: { value?: { raw?: string } }[];
  // Type annotation nodes
  elementType?: ESTreeNode;
  typeAnnotation?: ESTreeNode | { typeAnnotation?: ESTreeNode };
  typeName?: ESTreeNode;
  typeArguments?: { params?: ESTreeNode[] };
  typeParameters?: { params?: ESTreeNode[] };
  types?: ESTreeNode[];
  literal?: { value?: unknown };
  members?: ESTreeNode[];
  parameters?: ESTreeNode[];
  params?: ESTreeNode[];
  key?: ESTreeNode | { name?: string; value?: unknown };
  computed?: boolean;
  shorthand?: boolean;
  optional?: boolean;
  // Statement / block nodes
  body?: ESTreeNode | ESTreeNode[];
  block?: ESTreeNode;
  init?: ESTreeNode;
  update?: ESTreeNode;
  discriminant?: ESTreeNode;
  cases?: ESTreeNode[];
  handler?: ESTreeNode;
  finalizer?: ESTreeNode;
  label?: ESTreeNode | { name?: string };
  declarations?: ESTreeNode[];
  param?: ESTreeNode;
  kind?: string;
  id?: ESTreeNode;
  source?: { value?: string };
  specifiers?: Array<{ type?: string; imported?: { name?: string }; local?: { name?: string }; exported?: { name?: string } }>;
  [key: string]: unknown;
}
function defaultContext(overrides?: Partial<GenerateContext>): GenerateContext {
  return { indent: "", ...overrides };
}

/** Build context for a child expression (e.g. left/right of BinaryExpression). */
function childContext(
  ctx: GenerateContext,
  parent: ESTreeNode,
  isRightHand: boolean
): GenerateContext {
  return { ...ctx, parent, isRightHand };
}

const INDENT = "  ";

/** Indent all non-empty lines in text. */
function indentText(text: string, indent: string): string {
  return String(text)
    .split("\n")
    .map((line) => (line.length ? indent + line : line))
    .join("\n");
}

// ---------------------------------------------------------------------------
// TypeExpr generators (object dispatcher, same pattern as expression)
// ---------------------------------------------------------------------------

type TypeExprHandler = (
  node: ESTreeNode,
  typeMap?: Map<string, string>
) => string;

const typeExprGenerators: Record<string, TypeExprHandler> = {
  TSStringKeyword: () => "string",
  TSNumberKeyword: () => "number",
  TSBooleanKeyword: () => "boolean",
  TSBigIntKeyword: () => "bigint",
  TSAnyKeyword: () => "any",
  TSUnknownKeyword: () => "unknown",
  TSVoidKeyword: () => "void",
  TSNullKeyword: () => "null",
  TSUndefinedKeyword: () => "undefined",
  TSObjectKeyword: () => "Object",

  TSArrayType(node, typeMap) {
    return `${generateTypeExpr(node.elementType, typeMap)}[]`;
  },

  TSParenthesizedType(node, typeMap) {
    const inner = node.typeAnnotation as ESTreeNode;
    return `(${generateTypeExpr(inner, typeMap)})`;
  },

  TSTypeOperator(node, typeMap) {
    const inner = node.typeAnnotation as ESTreeNode;
    return `${node.operator} ${generateTypeExpr(inner, typeMap)}`;
  },

  TSQualifiedName(node, typeMap) {
    const left = generateTypeExpr(node.left, typeMap);
    const rightName = (node.right as ESTreeNode)?.name ?? "";
    return `${left}.${rightName}`;
  },

  Identifier(node, typeMap) {
    return typeMap?.get(node.name ?? "") ?? node.name ?? "";
  },

  TSTypeReference(node, typeMap) {
    let baseType = generateTypeExpr(node.typeName, typeMap);
    const genericParams = node.typeArguments ?? node.typeParameters;
    if (genericParams?.params?.length) {
      const typeParams = genericParams.params
        .map((p) => generateTypeExpr(p, typeMap))
        .join(", ");
      return `${baseType}<${typeParams}>`;
    }
    return baseType;
  },

  TSUnionType(node, typeMap) {
    return (node.types ?? []).map((t) => generateTypeExpr(t, typeMap)).join("|");
  },

  TSLiteralType(node) {
    return typeof (node.literal?.value as unknown);
  },

  TSTypeLiteral(node, typeMap) {
    const members = (node.members ?? []).filter((m) => m.type === "TSPropertySignature");
    const parts = members.map((member) => {
      const key = (member.key as ESTreeNode)?.name ?? (member.key as { value?: string })?.value ?? "";
      const typeAnn = member.typeAnnotation as { typeAnnotation?: ESTreeNode };
      const type = generateTypeExpr(typeAnn?.typeAnnotation, typeMap);
      const optional = member.optional ? "?" : "";
      return key ? `${key}${optional}: ${type}` : "";
    }).filter(Boolean);
    return `{ ${parts.join(", ")} }`;
  },

  TSFunctionType(node, typeMap) {
    const params = node.parameters ?? [];
    const paramParts = params.map((param) => {
      const paramName = param.name as unknown;
      const name = (typeof paramName === "object" && paramName && "name" in paramName
        ? (paramName as { name: string }).name
        : paramName) ?? "";
      const typeAnn = param.typeAnnotation as { typeAnnotation?: ESTreeNode };
      const type = generateTypeExpr(typeAnn?.typeAnnotation, typeMap);
      const optional = param.optional ? "?" : "";
      return name ? `${name}${optional}: ${type}` : type;
    });
    const returnTypeAnn = node.typeAnnotation as { typeAnnotation?: ESTreeNode };
    const returnType = generateTypeExpr(returnTypeAnn?.typeAnnotation, typeMap);
    return `(${paramParts.join(", ")}) => ${returnType}`;
  },
};

/**
 * Generate JSDoc type string for a type AST node. Dispatches via typeExprGenerators.
 */
export function generateTypeExpr(
  typeNode: ESTreeNode | undefined | null,
  typeMap?: Map<string, string>
): string {
  if (!typeNode) return "unknown";
  const handler = typeExprGenerators[typeNode.type];
  if (handler) return handler(typeNode, typeMap);
  return "unknown";
}

// ---------------------------------------------------------------------------
// Binding patterns (ArrayPattern, ObjectPattern — used in expressions too, e.g. LHS of assignment)
// ---------------------------------------------------------------------------

function generateBindingPattern(node: ESTreeNode, ctx: GenerateContext): string {
  if (!node) return "";
  if (node.type === "Identifier")
    return (node.name as string) ?? "";
  if (node.type === "RestElement")
    return "..." + generateBindingPattern(node.argument as ESTreeNode, ctx);
  if (node.type === "AssignmentPattern") {
    const left = generateBindingPattern(node.left as ESTreeNode, ctx);
    const right = node.right
      ? generateExpression(node.right as ESTreeNode, ctx)
      : "";
    return right ? `${left} = ${right}` : left;
  }
  if (node.type === "ArrayPattern") {
    const elements = (node.elements ?? []) as (ESTreeNode | null)[];
    const elts = elements.map((el) =>
      el == null ? "" : generateBindingPattern(el, ctx)
    );
    return "[" + elts.join(", ") + "]";
  }
  if (node.type === "ObjectPattern") {
    const props = (node.properties ?? []) as ESTreeNode[];
    const parts = props.map((prop) => {
      if (prop.type === "RestElement")
        return "..." + generateBindingPattern(prop.argument as ESTreeNode, ctx);
      const key = (prop.key as { name?: string; value?: unknown }).name ??
        ((prop.key as { value?: unknown }).value != null
          ? JSON.stringify((prop.key as { value: unknown }).value)
          : (prop as { computed?: boolean }).computed
            ? generateExpression(prop.key as ESTreeNode, ctx)
            : "");
      const value = prop.value
        ? generateBindingPattern(prop.value as ESTreeNode, ctx)
        : "";
      return (prop as { shorthand?: boolean }).shorthand ? key : `${key}: ${value}`;
    });
    return "{ " + parts.join(", ") + " }";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Expression generators (object dispatcher, same pattern as typeExpr)
// ---------------------------------------------------------------------------

type ExpressionHandler = (node: ESTreeNode, ctx: GenerateContext) => string;

function exprChild(
  node: ESTreeNode,
  ctx: GenerateContext,
  parent: ESTreeNode,
  key: string,
  isRightHand: boolean
): string {
  const child = node[key];
  if (child == null) return "";
  return generateExpression(child as ESTreeNode, childContext(ctx, parent, isRightHand));
}

const expressionGenerators: Record<string, ExpressionHandler> = {
  Identifier(node) {
    return (node.name as string) ?? "";
  },

  Literal(node) {
    const v = node.value;
    if (v === null) return "null";
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "string") return JSON.stringify(v);
    if (node.raw != null) return node.raw as string;
    return String(v);
  },

  ThisExpression() {
    return "this";
  },

  BinaryExpression(node, ctx) {
    const parent = node;
    const left = exprChild(node, ctx, parent, "left", false);
    const right = exprChild(node, ctx, parent, "right", true);
    return `${left} ${node.operator} ${right}`;
  },

  LogicalExpression(node, ctx) {
    const parent = node;
    const left = exprChild(node, ctx, parent, "left", false);
    const right = exprChild(node, ctx, parent, "right", true);
    return `${left} ${node.operator} ${right}`;
  },

  UnaryExpression(node, ctx) {
    const arg = generateExpression(node.argument as ESTreeNode, ctx);
    return (node.prefix as boolean) ? `${node.operator}${arg}` : `${arg}${node.operator}`;
  },

  UpdateExpression(node, ctx) {
    const arg = generateExpression(node.argument as ESTreeNode, ctx);
    return (node.prefix as boolean) ? `${node.operator}${arg}` : `${arg}${node.operator}`;
  },

  ConditionalExpression(node, ctx) {
    const parent = node;
    const test = exprChild(node, ctx, parent, "test", false);
    const cons = exprChild(node, ctx, parent, "consequent", false);
    const alt = exprChild(node, ctx, parent, "alternate", true);
    return `${test} ? ${cons} : ${alt}`;
  },

  AssignmentExpression(node, ctx) {
    const parent = node;
    const left = exprChild(node, ctx, parent, "left", false);
    const right = exprChild(node, ctx, parent, "right", true);
    return `${left} ${node.operator} ${right}`;
  },

  SequenceExpression(node, ctx) {
    const expressions = (node.expressions ?? []) as ESTreeNode[];
    const parts = expressions.map((e) => generateExpression(e, ctx));
    return "(" + parts.join(", ") + ")";
  },

  ArrowFunctionExpression(node, ctx) {
    const params = (node.params ?? node.parameters ?? []) as ESTreeNode[];
    const paramStr = params
      .map((p) => (p.type === "Identifier" ? (p.name as string) : generateBindingPattern(p, ctx)))
      .filter(Boolean)
      .join(", ");
    const body = node.body as ESTreeNode;
    const bodyCode =
      body?.type === "BlockStatement"
        ? generateBlock(body, ctx)
        : body
          ? generateExpression(body, ctx)
          : "{}";
    return "(" + paramStr + ") => " + bodyCode;
  },

  FunctionExpression(node, ctx) {
    const namePart = (node.id as ESTreeNode)?.name ? (node.id as ESTreeNode).name + " " : "";
    const params = (node.params ?? node.parameters ?? []) as ESTreeNode[];
    const paramStr = params
      .map((p) => (p.type === "Identifier" ? (p.name as string) : generateBindingPattern(p, ctx)))
      .filter(Boolean)
      .join(", ");
    const body = node.body as ESTreeNode;
    const bodyCode =
      body?.type === "BlockStatement" ? generateBlock(body, ctx) : "{}";
    return "function " + namePart + "(" + paramStr + ") " + bodyCode;
  },

  CallExpression(node, ctx) {
    const callee = generateExpression(node.callee as ESTreeNode, ctx);
    const args = (node.arguments ?? []) as ESTreeNode[];
    const argStr = args.map((a) => generateExpression(a, ctx)).join(", ");
    return `${callee}(${argStr})`;
  },

  NewExpression(node, ctx) {
    const callee = generateExpression(node.callee as ESTreeNode, ctx);
    const args = (node.arguments ?? []) as ESTreeNode[];
    const argStr = args.map((a) => generateExpression(a, ctx)).join(", ");
    return `new ${callee}(${argStr})`;
  },

  MemberExpression(node, ctx) {
    const obj = generateExpression(node.object as ESTreeNode, ctx);
    const prop = (node as { computed?: boolean }).computed
      ? "[" + generateExpression(node.property as ESTreeNode, ctx) + "]"
      : "." + ((node.property as { name?: string })?.name ?? "");
    return obj + prop;
  },

  ObjectExpression(node, ctx) {
    const props = (node.properties ?? []) as ESTreeNode[];
    const parts = props.map((prop) => {
      if (prop.type === "SpreadElement")
        return "..." + generateExpression(prop.argument as ESTreeNode, ctx);
      const key = (prop.key as { name?: string })?.name ??
        (prop.key ? generateExpression(prop.key as ESTreeNode, ctx) : "");
      const value = prop.value
        ? generateExpression(prop.value as ESTreeNode, ctx)
        : "";
      return (prop as { shorthand?: boolean }).shorthand ? key : `${key}: ${value}`;
    });
    return "{ " + parts.join(", ") + " }";
  },

  ArrayExpression(node, ctx) {
    const elements = (node.elements ?? []) as (ESTreeNode | null)[];
    const elts = elements.map((el) =>
      el == null
        ? ""
        : el.type === "SpreadElement"
          ? "..." + generateExpression(el.argument as ESTreeNode, ctx)
          : generateExpression(el, ctx)
    );
    return "[" + elts.join(", ") + "]";
  },

  AwaitExpression(node, ctx) {
    return "await " + generateExpression(node.argument as ESTreeNode, ctx);
  },

  TemplateLiteral(node, ctx) {
    const quasis = (node.quasis ?? []) as { value?: { raw?: string } }[];
    const exprs = (node.expressions ?? []) as ESTreeNode[];
    const parts: string[] = [];
    for (let i = 0; i < quasis.length; i++) {
      const raw = (quasis[i].value?.raw ?? "").replace(/\\/g, "\\\\").replace(/`/g, "\\`");
      parts.push(raw);
      if (i < exprs.length)
        parts.push("${" + generateExpression(exprs[i], ctx) + "}");
    }
    return "`" + parts.join("") + "`";
  },

  TSNonNullExpression(node, ctx) {
    return generateExpression(node.expression as ESTreeNode, ctx);
  },

  OptionalMemberExpression(node, ctx) {
    const obj = generateExpression(node.object as ESTreeNode, ctx);
    const prop = (node as { computed?: boolean }).computed
      ? "?.[" + generateExpression(node.property as ESTreeNode, ctx) + "]"
      : "?." + ((node.property as { name?: string })?.name ?? "");
    return obj + prop;
  },

  OptionalCallExpression(node, ctx) {
    const callee = generateExpression(node.callee as ESTreeNode, ctx);
    const args = (node.arguments ?? []) as ESTreeNode[];
    const argStr = args.map((a) => generateExpression(a, ctx)).join(", ");
    return `${callee}?.(${argStr})`;
  },

  ChainExpression(node, ctx) {
    return generateExpression(node.expression as ESTreeNode, ctx);
  },

  TSAsExpression(node, ctx) {
    const ann = node.typeAnnotation as ESTreeNode | { typeAnnotation?: ESTreeNode } | undefined;
    const typeNode =
      ann && typeof ann === "object" && (ann as ESTreeNode).type === "TSTypeAnnotation"
        ? (ann as { typeAnnotation: ESTreeNode }).typeAnnotation
        : (ann as { typeAnnotation?: ESTreeNode })?.typeAnnotation ?? (ann as ESTreeNode);
    const typeStr = generateTypeExpr(typeNode, ctx.typeMap);
    const inner = generateExpression(node.expression as ESTreeNode, ctx);
    return `/** @type {${typeStr}} */(${inner})`;
  },

  TSTypeAssertion(node, ctx) {
    const ann = node.typeAnnotation as ESTreeNode | { typeAnnotation?: ESTreeNode } | undefined;
    const typeNode =
      ann && typeof ann === "object" && (ann as ESTreeNode).type === "TSTypeAnnotation"
        ? (ann as { typeAnnotation: ESTreeNode }).typeAnnotation
        : (ann as { typeAnnotation?: ESTreeNode })?.typeAnnotation ?? (ann as ESTreeNode);
    const typeStr = generateTypeExpr(typeNode, ctx.typeMap);
    const inner = generateExpression(node.expression as ESTreeNode, ctx);
    return `/** @type {${typeStr}} */(${inner})`;
  },

  ArrayPattern(node, ctx) {
    return generateBindingPattern(node, ctx);
  },

  ObjectPattern(node, ctx) {
    return generateBindingPattern(node, ctx);
  },
};

// ---------------------------------------------------------------------------
// Statement generators (object dispatcher; cross-calls to generateExpression, generateBlock)
// ---------------------------------------------------------------------------

type StatementHandler = (node: ESTreeNode, ctx: GenerateContext) => string;

/** JSDoc for function type (e.g. variable with function type annotation or arrow init). Used by VariableDeclaration. */
function generateFunctionTypeJSDoc(
  node: ESTreeNode | { typeAnnotation?: ESTreeNode; type?: string } | null | undefined,
  typeMap?: Map<string, string>
): string | null {
  if (!node) return null;
  const n = node as ESTreeNode;
  const typeAnn =
    n.type === "TSTypeAnnotation"
      ? (n.typeAnnotation as ESTreeNode)
      : n;
  let parameters: ESTreeNode[] = [];
  let returnTypeNode: ESTreeNode | undefined;

  if (typeAnn?.type === "TSFunctionType") {
    parameters = (typeAnn.parameters as ESTreeNode[]) ?? [];
    const tt = typeAnn.typeAnnotation as { typeAnnotation?: ESTreeNode };
    returnTypeNode = tt?.typeAnnotation;
  } else if (
    n.type === "ArrowFunctionExpression" ||
    n.type === "FunctionExpression"
  ) {
    const typeAnn = n.typeAnnotation as { type?: string; parameters?: ESTreeNode[]; typeAnnotation?: { typeAnnotation?: ESTreeNode } } | undefined;
    if (typeAnn?.type === "TSFunctionType") {
      parameters = (typeAnn.parameters as ESTreeNode[]) ?? [];
      returnTypeNode = typeAnn.typeAnnotation?.typeAnnotation;
    } else {
      parameters = ((n.params ?? n.parameters) as ESTreeNode[] | undefined) ?? [];
      const arrowRet = (n as { returnType?: { typeAnnotation?: ESTreeNode } }).returnType;
      returnTypeNode = arrowRet?.typeAnnotation ?? (n.typeAnnotation as { typeAnnotation?: ESTreeNode })?.typeAnnotation;
    }
  } else if (n.type === "TSTypeAnnotation") {
    return generateFunctionTypeJSDoc(n.typeAnnotation as ESTreeNode, typeMap);
  } else {
    return null;
  }

  const lines: string[] = [];
  for (let i = 0; i < parameters.length; i++) {
    const param = parameters[i];
    const name =
      param.type === "RestElement"
        ? ((param.argument as ESTreeNode)?.name ?? "rest")
        : ((param as { name?: string | ESTreeNode }).name as string) ??
        (param as ESTreeNode).name ??
        "arg" + i;
    if (param.type === "RestElement") {
      const argType = (param.argument as ESTreeNode)?.typeAnnotation as { typeAnnotation?: ESTreeNode } | undefined;
      const restType = generateTypeExpr(argType?.typeAnnotation, typeMap);
      lines.push(` * @param {...${restType || "unknown"}} ${name}`);
    } else {
      const paramTypeAnn = (param as ESTreeNode).typeAnnotation as { typeAnnotation?: ESTreeNode } | undefined;
      const typeStr = generateTypeExpr(paramTypeAnn?.typeAnnotation, typeMap);
      const optional = (param as ESTreeNode).optional ? "=" : "";
      lines.push(` * @param {${typeStr}${optional}} ${name}`);
    }
  }
  const returnTypeStr = returnTypeNode ? generateTypeExpr(returnTypeNode, typeMap) : "void";
  lines.push(` * @return {${returnTypeStr}}`);
  return "/**\n" + lines.join("\n") + "\n */";
}

/** Serialize for-loop init (VariableDeclaration without semicolon, or expression). */
function serializeForInit(node: ESTreeNode | null | undefined, ctx: GenerateContext): string {
  if (!node) return "";
  if (node.type !== "VariableDeclaration")
    return generateExpression(node, ctx);
  const decls = node.declarations ?? [];
  const parts = decls.map((decl) => {
    const id = decl.id ?? decl;
    const leftPart = id.type === "Identifier" ? id.name : generateBindingPattern(id, ctx);
    if (!leftPart) return "";
    const init = decl.init ? generateExpression(decl.init, ctx) : "";
    return init ? `${leftPart} = ${init}` : leftPart;
  }).filter(Boolean);
  return parts.length ? `${node.kind} ${parts.join(", ")}` : node.kind ?? "";
}

const statementGenerators: Record<string, StatementHandler> = {
  VariableDeclaration(node, ctx) {
    const lines: string[] = [];
    const kind = node.kind ?? "const";
    const tag = kind === "const" ? "const" : "type";
    for (const decl of node.declarations ?? []) {
      const id = decl.id ?? decl;
      const leftPart = id.type === "Identifier" ? id.name : generateBindingPattern(id, ctx);
      if (!leftPart) continue;
      const init = decl.init;
      const typeAnn = id.typeAnnotation as { typeAnnotation?: ESTreeNode } | undefined;
      const typeNode = typeAnn?.typeAnnotation;
      const isFunctionInit = init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression";
      const block =
        generateFunctionTypeJSDoc(id.typeAnnotation ?? (isFunctionInit ? init : null), ctx.typeMap) ??
        (typeNode
          ? (() => {
            const typeStr = generateTypeExpr(typeNode, ctx.typeMap);
            return typeStr ? `/** @${tag} {${typeStr}} */` : "";
          })()
          : "");
      if (block) lines.push(block);
      const initCode = init ? generateExpression(init, ctx) : "";
      lines.push(initCode ? `${kind} ${leftPart} = ${initCode};` : `${kind} ${leftPart};`);
    }
    return lines.join("\n");
  },

  ExpressionStatement(node, ctx) {
    return generateExpression(node.expression!, ctx) + ";";
  },

  ReturnStatement(node, ctx) {
    if (!node.argument) return "return;";
    return "return " + generateExpression(node.argument, ctx) + ";";
  },

  ForStatement(node, ctx) {
    const init = serializeForInit(node.init, ctx);
    const test = node.test ? generateExpression(node.test, ctx) : "";
    const update = node.update ? generateExpression(node.update, ctx) : "";
    const head = `for (${init}; ${test}; ${update})`;
    return head + formatLoopBody(node.body, ctx);
  },

  ForInStatement(node, ctx) {
    const left = serializeForInit(node.left, ctx);
    const right = node.right ? generateExpression(node.right, ctx) : "";
    return `for (${left} in ${right})` + formatLoopBody(node.body, ctx);
  },

  ForOfStatement(node, ctx) {
    const awaitPart = (node as { await?: boolean }).await ? "await " : "";
    const left = serializeForInit(node.left, ctx);
    const right = node.right ? generateExpression(node.right, ctx) : "";
    return `for (${awaitPart}${left} of ${right})` + formatLoopBody(node.body, ctx);
  },

  IfStatement(node, ctx) {
    const test = "if (" + generateExpression(node.test!, ctx) + ")";
    const indent = ctx.indent ?? "";
    const inner = indent + INDENT;
    const consequent = Array.isArray(node.consequent) ? node.consequent[0] : node.consequent;
    const consequentCode =
      consequent?.type === "BlockStatement"
        ? " " + generateBlock(consequent, ctx)
        : "\n" + indentText(generateStatement(consequent!, { ...ctx, indent: inner }), INDENT);
    let out = test + consequentCode;
    if (node.alternate) {
      const alt = node.alternate;
      if (alt.type === "BlockStatement")
        out += " else " + generateBlock(alt, ctx);
      else
        out += "\nelse\n" + indentText(generateStatement(alt, { ...ctx, indent: inner }), INDENT);
    }
    return out;
  },

  EmptyStatement() {
    return "";
  },

  BlockStatement(node, ctx) {
    return generateBlock(node, ctx);
  },

  BreakStatement(node) {
    const label = node.label as { name?: string } | undefined;
    return label?.name ? `break ${label.name};` : "break;";
  },

  ContinueStatement(node) {
    const label = node.label as { name?: string } | undefined;
    return label?.name ? `continue ${label.name};` : "continue;";
  },

  ThrowStatement(node, ctx) {
    return "throw " + generateExpression(node.argument!, ctx) + ";";
  },

  WhileStatement(node, ctx) {
    const test = generateExpression(node.test!, ctx);
    return "while (" + test + ")" + formatLoopBody(node.body, ctx);
  },

  DoWhileStatement(node, ctx) {
    const indent = ctx.indent ?? "";
    const body = Array.isArray(node.body) ? node.body[0] : node.body;
    const bodyCode = body?.type === "BlockStatement"
      ? " " + generateBlock(body, ctx)
      : "\n" + indentText(generateStatement(body!, { ...ctx, indent: indent + INDENT }), INDENT);
    const test = generateExpression(node.test!, ctx);
    return "do" + bodyCode + " while (" + test + ");";
  },

  SwitchStatement(node, ctx) {
    const discriminant = generateExpression(node.discriminant!, ctx);
    const indent = ctx.indent ?? "";
    const inner = indent + INDENT;
    const caseInner = inner + INDENT;
    const close = indent.length >= 2 ? indent.slice(2) : "";
    let out = "switch (" + discriminant + ") {\n";
    for (const c of node.cases ?? []) {
      out += inner + (c.test ? "case " + generateExpression(c.test, ctx) + ":" : "default:") + "\n";
      const consequentList = Array.isArray(c.consequent) ? c.consequent : c.consequent ? [c.consequent] : [];
      for (const stmt of consequentList) {
        const one = Array.isArray(stmt) ? (stmt as ESTreeNode[])[0] : (stmt as ESTreeNode);
        if (one) out += indentText(generateStatement(one, { ...ctx, indent: caseInner }), caseInner) + "\n";
      }
    }
    return out + close + "}";
  },

  TryStatement(node, ctx) {
    let out = "try " + generateBlock(node.block!, ctx);
    if (node.handler) {
      const param = node.handler.param;
      const paramName = param?.type === "Identifier" ? param.name : "e";
      const handlerBody = node.handler.body;
      const block =
        Array.isArray(handlerBody)
          ? ({ type: "BlockStatement", body: handlerBody } as ESTreeNode)
          : handlerBody!;
      out += " catch (" + paramName + ") " + generateBlock(block, ctx);
    }
    if (node.finalizer)
      out += " finally " + generateBlock(node.finalizer, ctx);
    return out;
  },

  LabeledStatement(node, ctx) {
    const labelName = (node.label as { name?: string })?.name ?? "label";
    const body = Array.isArray(node.body) ? node.body[0] : node.body;
    return labelName + ": " + generateStatement(body!, ctx);
  },

  DebuggerStatement() {
    return "debugger;";
  },
};

/** Format loop body: " {}", or " " + block, or newline + indented single statement. */
function formatLoopBody(
  body: ESTreeNode | ESTreeNode[] | null | undefined,
  ctx: GenerateContext
): string {
  const single = Array.isArray(body) ? body[0] : body;
  if (!single) return " {}";
  if (single.type === "BlockStatement")
    return " " + generateBlock(single, { ...ctx, indent: "" });
  const indent = ctx.indent ?? "";
  const inner = indent + INDENT;
  return "\n" + indentText(generateStatement(single, { ...ctx, indent: inner }), INDENT);
}

/** Generate block body; calls generateStatement for each statement. */
function generateBlock(blockNode: ESTreeNode, ctx: GenerateContext): string {
  const baseIndent = ctx.indent ?? "";
  const contentIndent = baseIndent + INDENT;
  const close = baseIndent;
  if (!blockNode || blockNode.type !== "BlockStatement" || !blockNode.body)
    return "{}";
  const raw = blockNode.body;
  const bodyList: ESTreeNode[] = Array.isArray(raw)
    ? raw.flatMap((s) => (Array.isArray(s) ? s : [s]))
    : [raw];
  const inner = bodyList
    .map((stmt) => indentText(generateStatement(stmt, { ...ctx, indent: contentIndent }), contentIndent))
    .join("\n");
  return inner ? `{\n${inner}\n${close}}` : "{}";
}

/**
 * Generate JS source for a statement AST node. Dispatches via statementGenerators.
 * Cross-calls: generateExpression (for expr parts), generateBlock (which calls generateStatement).
 */
const generateStatement = (
  node: ESTreeNode,
  context?: Partial<GenerateContext>
): string => {
  const ctx = { ...defaultContext(), ...context };
  const handler = statementGenerators[node.type];
  if (handler) return handler(node, ctx);
  throw new Error("Unsupported statement type: " + (node?.type ?? "null"));
}

// ---------------------------------------------------------------------------
// Import / Export (program body)
// ---------------------------------------------------------------------------

/** ImportDeclaration → JS import string. */
export function generateImport(node: ESTreeNode): string {
  const specifiers = node.specifiers ?? [];
  const source = (node.source as { value?: string } | undefined)?.value ?? "";
  if (specifiers.length === 0) return `import "${source}";\n`;
  const defaultSpec = specifiers.find((s) => s.type === "ImportDefaultSpecifier");
  const namedSpecs = specifiers.filter((s) => s.type !== "ImportDefaultSpecifier");
  const defaultPart = defaultSpec?.local?.name ?? null;
  const namespaceSpec = namedSpecs.find((s) => s.type === "ImportNamespaceSpecifier");
  const namedOnly = namedSpecs.filter((s) => s.type !== "ImportNamespaceSpecifier");
  const namedParts = namedOnly.map((s) =>
    s.imported?.name === s.local?.name ? s.local?.name ?? "" : `${s.imported?.name ?? ""} as ${s.local?.name ?? ""}`
  );
  if (defaultPart && namedSpecs.length === 0) return `import ${defaultPart} from "${source}";\n`;
  if (namespaceSpec && namedOnly.length === 0 && !defaultPart)
    return `import * as ${namespaceSpec.local?.name ?? ""} from "${source}";\n`;
  if (defaultPart && namespaceSpec && namedOnly.length === 0)
    return `import ${defaultPart}, * as ${namespaceSpec.local?.name ?? ""} from "${source}";\n`;
  if (defaultPart && namedParts.length > 0)
    return `import ${defaultPart}, { ${namedParts.join(", ")} } from "${source}";\n`;
  if (defaultPart && namespaceSpec)
    return `import ${defaultPart}, * as ${namespaceSpec.local?.name ?? ""} from "${source}";\n`;
  return `import { ${namedParts.join(", ")} } from "${source}";\n`;
}

/** ExportNamedDeclaration → JS export block. */
const generateExport = (node: ESTreeNode): string => {
  const specifiers = node.specifiers ?? [];
  if (specifiers.length === 0) return "";
  const entries = specifiers.map((s) => "  " + (s.exported?.name ?? "")).join(",\n");
  return "export {\n" + entries + "\n};\n";
}

// ---------------------------------------------------------------------------
// Program root (delegate enum/typedef/interface/class to closureFromAst)
// ---------------------------------------------------------------------------

/**
 * One program-body node: import, export, enum, typedef, interface, class, or statement.
 */
const generateProgramBody = (
  node: ESTreeNode,
  typeMap?: Map<string, string>
): string => {
  const type = node?.type;
  if (!type) return "";
  if (type === "ImportDeclaration") return generateImport(node);
  if (type === "TSEnumDeclaration") {
    if (!(node as { const?: boolean }).const) throw new Error("Only const enum is allowed");
    return generateEnum(node, typeMap);
  }
  if (type === "TSTypeAliasDeclaration") return "\n" + generateTypedef(node, typeMap);
  if (type === "TSInterfaceDeclaration") return generateClassInterface(node, typeMap);
  if (type === "ClassDeclaration") return generateClassDeclaration(node, typeMap);
  if (type === "VariableDeclaration") return generateStatement(node, { typeMap }) + "\n";
  if (type === "ExportNamedDeclaration") return "\n" + generateExport(node);
  if (type.endsWith("Statement")) return generateStatement(node, { typeMap }) + "\n";
  return "";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Serialize a full program AST to kdjs-js. Loops program.body and uses generateProgramBody.
 */
const generate = (
  ast: ESTreeNode & { body?: ESTreeNode[] },
  typeMap?: Map<string, string>
): string => {
  let out = "";
  for (const node of ast?.body ?? []) out += generateProgramBody(node, typeMap);
  return out;
}

/**
 * Generate JS source for an expression AST node.
 * Step 1: only expression types that do not contain statements (no ArrowFunction/FunctionExpression with block body).
 */
const generateExpression = (
  node: ESTreeNode,
  context?: Partial<GenerateContext>
): string => {
  const ctx = { ...defaultContext(), ...context };
  const handler = expressionGenerators[node.type];
  if (handler) return handler(node, ctx);
  throw new Error("Unsupported expression type: " + (node?.type ?? "null"));
}

export {
  generate,
  generateExpression,
  generateStatement
};

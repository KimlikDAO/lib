import {
  ArrayExpression,
  ArrayPattern,
  ArrowFunctionExpression,
  AssignmentExpression,
  AssignmentPattern,
  AwaitExpression,
  BinaryExpression,
  BlockStatement,
  BreakStatement,
  CallExpression,
  CatchClause,
  ChainExpression,
  ClassBody,
  ClassDeclaration,
  ClassExpression,
  ConditionalExpression,
  ContinueStatement,
  EmptyStatement,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  IfStatement,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportExpression,
  ImportSpecifier,
  Literal,
  LogicalExpression,
  MemberExpression,
  MethodDefinition,
  NewExpression,
  Node,
  ObjectExpression,
  ObjectPattern,
  ParenthesizedExpression,
  Program,
  Property,
  PropertyDefinition,
  RestElement,
  SequenceExpression,
  SpreadElement,
  SwitchCase,
  SwitchStatement,
  TaggedTemplateExpression,
  TemplateLiteral,
  ThrowStatement,
  TryStatement,
  UnaryExpression,
  UpdateExpression,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
  YieldExpression
} from "acorn";
import { partition } from "../../util/arrays";
import { typeReferenceName } from "../ast/guards";
import {
  probeArrayLikeElementType,
  probeEnumType,
  probeExpressionType
} from "../ast/probe";
import {
  ReturnStatement,
  TSArrayType,
  TSAsExpression,
  TSConstructorType,
  TSDeclareFunction,
  TSEnumDeclaration,
  TSEnumMember,
  TSExpressionWithTypeArguments,
  TSFunctionType,
  TSImportType,
  TSIndexedAccessType,
  TSInferType,
  TSIntersectionType,
  TSInterfaceBody,
  TSInterfaceDeclaration,
  TSIntrinsicKeyword,
  TSLiteralType,
  TSMappedType,
  TSMethodSignature,
  TSModuleDeclaration,
  TSNamedTupleMember,
  TSNonNullExpression,
  TSOptionalType,
  TSParameter,
  TSParameterProperty,
  TSParenthesizedType,
  TSPropertySignature,
  TSQualifiedName,
  TSRestType,
  TSSatisfiesExpression,
  TSThisType,
  TSTupleType,
  TSTypeAliasDeclaration,
  TSTypeAnnotation,
  TSTypeLiteral,
  TSTypeOperator,
  TSTypeParameter,
  TSTypeParameterDeclaration,
  TSTypeParameterInstantiation,
  TSTypePredicate,
  TSTypeQuery,
  TSTypeReference,
  TSUnionType
} from "../ast/types";
import { Generator } from "../ast/walk";
import { Modifier, hasAll } from "../model/modifier";
import { ModuleImports } from "../model/moduleImports";
import { SourceId } from "../model/source";
import { entityNameText, toIdentifier } from "./names";
import { conditionalType, renderClosureType } from "./ttlGenerator";

const removeOrigin = (source: SourceId): string =>
  source.slice(source.indexOf(":") + 1);

const generateAliasImports = (moduleImports: ModuleImports): string => {
  let out = "";
  for (const localName in moduleImports.byLocal) {
    const binding = moduleImports.byLocal[localName];
    out += "/** @const */\n";
    out += `const ${localName} = ${toIdentifier(binding.source, binding.importedName)};\n`;
  }
  return out;
};

const generateEsmImports = (moduleImports: ModuleImports): string => {
  let out = "";
  const groups = moduleImports.groupBySource();
  const emitImport = (
    source: SourceId,
    hasDefault: boolean,
    hasNamespace: boolean,
    namedImports: string[]
  ) => {
    out += "import";
    if (hasDefault)
      out += ` ${toIdentifier(source, "default")}`;
    if (hasNamespace) {
      if (hasDefault)
        out += ",";
      out += ` * as ${toIdentifier(source, "*")}`;
    } else if (namedImports.length) {
      out += hasDefault ? ", { " : " { ";
      out += namedImports.map((importedName) =>
        `${importedName} as ${toIdentifier(source, importedName)}`
      ).join(", ");
      out += " }";
    }
    out += ` from "${removeOrigin(source)}";\n`;
  };

  const sources = (Object.keys(groups)
    .filter(source => source != "package:@kimlikdao/kdts")
    .sort()) as SourceId[];
  for (const source of sources) {
    const imports = groups[source];
    const hasDefault = "default" in imports;
    const hasNamespace = "*" in imports;
    const namedImports = Object.keys(imports)
      .filter((importedName) => importedName != "default" && importedName != "*")
      .sort();

    if (hasNamespace && namedImports.length) {
      emitImport(source, hasDefault, true, []);
      emitImport(source, false, false, namedImports);
    } else
      emitImport(source, hasDefault, hasNamespace, namedImports);
  }
  return out;
};

enum EmitMode {
  Binding,
  BindingJsDoc,
  BindingTs,
  JsDocParamType
};

type JsDocTypeTarget = { typeAnnotation?: TSTypeAnnotation | null; value?: Node | null; };
type JsDocTarget = {
  params?: TSParameter[];
  parameters?: TSParameter[];
  returnType?: TSTypeAnnotation | null;
  typeAnnotation?: TSTypeAnnotation | null;
  typeParameters?: TSTypeParameterDeclaration | null
};

const usesConstJsDoc = (modifiers = 0): boolean =>
  !!(modifiers & (Modifier.Readonly | Modifier.ClosureNamespace));

const hasTypeJsDocModifiers = (modifiers = 0): boolean =>
  !!(modifiers & (Modifier.ClosureNamespace | Modifier.NoInline));

const hasMultiLineTypeJsDocModifiers = (modifiers = 0): boolean =>
  !!(modifiers & Modifier.NoInline);

const genJsDocType = (d: VariableDeclarator): boolean => !!d.id.typeAnnotation ||
  !!(d.init && d.init.type.endsWith("FunctionExpression")) ||
  hasTypeJsDocModifiers(d.modifiers ?? 0);

const wrapExpression = (expr?: Node | null) =>
  expr?.type == "AssignmentExpression" && (expr as AssignmentExpression).left?.type == "ObjectPattern";

/** True when this expression must be wrapped in () when used as the object of a MemberExpression. */
const needsParensForMemberObject = (node?: Node | null) =>
  node?.type == "AssignmentExpression" || node?.type == "SequenceExpression";

const isFreshValueConstraint = (node?: Node): boolean => {
  if (node?.type != "TSTypeReference")
    return false;
  return entityNameText((node as TSTypeReference).typeName) == "FreshValue";
};

const jsDocParamName = (param: TSParameter): Identifier | null => {
  if (param.type == "TSParameterProperty")
    return jsDocParamName(param.parameter);
  if (param.type == "AssignmentPattern")
    return jsDocParamName(param.left as TSParameter);
  if (param.type == "RestElement")
    return jsDocParamName(param.argument as TSParameter);
  return param.type == "Identifier" ? param : null;
};

class GccGenerator extends Generator {
  private readonly templateScopes: string[][] = [];

  constructor(readonly djs: boolean = false) { super(); }

  private withTemplateScope<T>(
    params: TSTypeParameterDeclaration | null | undefined,
    fn: () => T
  ): T {
    const names = params?.params.map((param) => param.name);
    if (!names?.length)
      return fn();
    this.templateScopes.push(names);
    try {
      return fn();
    } finally {
      this.templateScopes.pop();
    }
  }

  private currentTemplateNames(params?: TSTypeParameterDeclaration | null): string[] {
    return [
      ...this.templateScopes.flat(),
      ...(params?.params.map((param) => param.name) || [])
    ];
  }

  private putRenderedType(node: Node | null | undefined) {
    this.put(renderClosureType(node as TSTypeAnnotation["typeAnnotation"], {
      djs: this.djs,
      templateNames: this.currentTemplateNames()
    }));
  }

  TSStringKeyword() { this.put("string"); }
  TSNumberKeyword() { this.put("number"); }
  TSBooleanKeyword() { this.put("boolean"); }
  TSBigIntKeyword() { this.put("bigint"); }
  TSAnyKeyword() { this.put("?"); }
  TSUnknownKeyword() { this.put("*"); }
  TSVoidKeyword() { this.put("void"); }
  TSNullKeyword() { this.put("null"); }
  TSUndefinedKeyword() { this.put("undefined"); }
  TSObjectKeyword() { this.put("Object"); }
  TSNeverKeyword() { this.put("void"); }
  TSSymbolKeyword() { this.put("symbol"); }

  // TS Type expressions
  TSArrayType(n: TSArrayType) { this.put("!Array<"); this.rec(n.elementType); this.put(">"); }
  TSAsExpression(n: TSAsExpression) {
    this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */(");
    this.rec(n.expression);
    this.put(")");
  }
  TSSatisfiesExpression(n: TSSatisfiesExpression) {
    if (typeReferenceName(n.typeAnnotation) == "PureExpr") {
      this.put("/** @pureOrBreakMyCode */("); this.rec(n.expression); this.put(")");
    } else
      this.rec(n.expression);
  }
  TSNonNullExpression(n: TSNonNullExpression) { this.rec(n.expression); }
  TSFunctionType(n: TSFunctionType) {
    this.put("function("); this.arr(n.parameters, ",", EmitMode.JsDocParamType); this.put("):");
    this.rec(n.typeAnnotation);
  }
  TSConstructorType(n: TSConstructorType) { this.putRenderedType(n); }
  TSConditionalType() { this.put("RETURN"); }
  TSLiteralType(n: TSLiteralType) {
    this.put(n.literal.type == "Literal" ? typeof n.literal.value : "string");
  }
  TSParenthesizedType(n: TSParenthesizedType) {
    this.put("("); this.rec(n.typeAnnotation); this.put(")");
  }
  TSTupleType(n: TSTupleType) { this.putRenderedType(n); }
  TSNamedTupleMember(n: TSNamedTupleMember) { this.putRenderedType(n); }
  TSUnionType(n: TSUnionType) { this.put("("); this.arr(n.types, "|"); this.put(")"); }
  TSIntersectionType(n: TSIntersectionType) { this.putRenderedType(n); }
  TSQualifiedName(n: TSQualifiedName) { this.rec(n.left); this.put("." + n.right.name); }
  TSTypeAnnotation(n: TSTypeAnnotation) { this.rec(n.typeAnnotation); }
  TSTypeLiteral(n: TSTypeLiteral, emitMode = EmitMode.BindingTs) {
    const sep = emitMode == EmitMode.BindingTs ? "," : "";
    this.put("{");
    this.inc(); this.arrLines(n.members, sep, emitMode); this.dec(); this.ret();
    this.put("}");
  }
  TSMappedType(n: TSMappedType) { this.putRenderedType(n); }
  TSInferType(n: TSInferType) { this.putRenderedType(n); }
  TSOptionalType(n: TSOptionalType) { this.putRenderedType(n); }
  TSRestType(n: TSRestType) { this.putRenderedType(n); }
  TSIndexedAccessType(n: TSIndexedAccessType) { this.putRenderedType(n); }
  TSTypeOperator(n: TSTypeOperator) { this.putRenderedType(n); }
  TSTypeQuery(n: TSTypeQuery) { this.put("typeof "); this.rec(n.exprName); }
  TSImportType(n: TSImportType) { this.putRenderedType(n); }
  TSTypePredicate(n: TSTypePredicate) { this.putRenderedType(n); }
  TSThisType(n: TSThisType) { this.putRenderedType(n); }
  TSIntrinsicKeyword(n: TSIntrinsicKeyword) { this.putRenderedType(n); }
  TSTypeParameter(n: TSTypeParameter) { this.put(n.name); }
  TSTypeParameterInstantiation(n: TSTypeParameterInstantiation) {
    this.put("<"); this.arr(n.params, ", "); this.put(">");
  }
  TSTypeReference(n: TSTypeReference) { this.put("!"); this.rec(n.typeName); this.rec(n.typeArguments); }
  TSExpressionWithTypeArguments(n: TSExpressionWithTypeArguments) {
    this.rec(n.expression);
    this.rec(n.typeArguments || n.typeParameters);
  }

  // TS Declarations
  TSEnumDeclaration(n: TSEnumDeclaration) {
    const type = probeEnumType(n);
    this.put(`/** @enum {${type}} */`); this.ret();
    this.put("const "); this.rec(n.id); this.put(" = {");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("};");
  }
  TSEnumMember(n: TSEnumMember) { this.rec(n.id); this.put(": "); this.rec(n.initializer); }
  TSTypeAliasDeclaration(n: TSTypeAliasDeclaration) {
    if (n.typeParameters) { this.StructuralInterfaceDeclaration(n); return; }
    this.doc(); this.ret();
    this.put("@typedef {"); this.rec(n.typeAnnotation); this.put("}");
    this.cod();
    this.put("const "); this.rec(n.id); this.put(" = {};");
  }
  TSTypeParameterDeclaration(n: TSTypeParameterDeclaration) {
    if (!n.params.length) return;
    const grouped: string[] = [];
    const flush = () => {
      if (!grouped.length) return;
      this.ret(); this.put("@template "); this.put(grouped.join(", "));
      grouped.length = 0;
    };
    for (const param of n.params)
      if (param.constraint && !isFreshValueConstraint(param.constraint)) {
        flush();
        this.ret(); this.put("@template {"); this.rec(param.constraint); this.put("} ");
        this.put(param.name);
      } else
        grouped.push(param.name);
    flush();
  }
  StructuralInterfaceDeclaration(n: TSTypeAliasDeclaration) {
    this.doc();
    this.put("@record", true);
    this.rec(n.typeParameters);
    this.cod();
    this.put("class "); this.rec(n.id); this.put(" ");
    this.withTemplateScope(n.typeParameters, () =>
      this.rec(n.typeAnnotation, EmitMode.BindingJsDoc)
    );
  }
  TSInterfaceDeclaration(n: TSInterfaceDeclaration) {
    this.doc();
    this.put("@interface", true);
    if (n.extends)
      for (const iface of n.extends) {
        this.ret(); this.put("@extends {"); this.rec(iface); this.put("}")
      }
    this.rec(n.typeParameters);
    this.cod();
    this.put("class "); this.rec(n.id); this.put(" ");
    this.withTemplateScope(n.typeParameters, () => this.rec(n.body));
  }
  TSInterfaceBody(n: TSInterfaceBody) {
    this.put("{");
    this.inc();
    this.arrLines(n.body, "", EmitMode.BindingJsDoc);
    this.dec(); if (n.body.length) this.ret();
    this.put("}");
  }
  TSMethodSignature(n: TSMethodSignature) {
    this.jsDoc(n, n.modifiers);
    this.rec(n.key); this.put("("); this.arr(n.parameters, ", "); this.put(") {}");
  }
  TSPropertySignature(n: TSPropertySignature, emitMode: EmitMode) {
    if (emitMode == EmitMode.BindingJsDoc) {
      this.jsDocType(n, 0); this.rec(n.key); this.put(";");
    } else {
      this.rec(n.key); this.put(": ");
      if (n.optional) this.put("("); this.rec(n.typeAnnotation); if (n.optional) this.put("|undefined)");
    }
  }
  TSParameterProperty(n: TSParameterProperty, emitMode: EmitMode) { this.rec(n.parameter, emitMode); }
  TSDeclareFunction(n: TSDeclareFunction) {
    this.jsDoc(n);
    this.put("function "); this.rec(n.id); this.put("("); this.arr(n.params, ", "); this.put(") ");
    this.put("{}");
  }
  TSModuleDeclaration(n: TSModuleDeclaration) {
    if (!n.global) throw "Not implemented";
    if (!this.djs) throw "Not supported yet";
    this.rec(n.body);
  }
  TSModuleBlock() { }

  // JS Expressions
  Literal(n: Literal) { this.put(n.raw ?? ""); }
  ArrayExpression(n: ArrayExpression) {
    this.put("[");
    if (n.elements.length > 4) {
      this.inc(); this.arrLines(n.elements, ","); this.dec(); this.ret();
    } else {
      this.arr(n.elements, ", ");
    }
    this.put("]");
  }
  AwaitExpression(n: AwaitExpression) { this.put("await "); this.rec(n.argument); }
  YieldExpression(n: YieldExpression) {
    this.put(n.delegate ? "yield*" : "yield");
    if (n.argument) { this.put(" "); this.rec(n.argument); }
  }
  BinaryExpression(n: BinaryExpression) {
    this.put("("); this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); this.put(")");
  }
  CallExpression(n: CallExpression) {
    const wrap = n.callee.type == "ArrowFunctionExpression";
    if (wrap) this.put("(");
    this.rec(n.callee);
    if (n.optional) this.put("?.");
    if (wrap) this.put(")");
    this.put("("); this.arr(n.arguments, ", "); this.put(")");
  }
  ParenthesizedExpression(n: ParenthesizedExpression) {
    this.put("("); this.rec(n.expression); this.put(")");
  }
  ChainExpression(n: ChainExpression) { this.rec(n.expression); }
  ConditionalExpression(n: ConditionalExpression) {
    this.put("("); this.rec(n.test); this.put(" ? ");
    this.rec(n.consequent); this.put(" : "); this.rec(n.alternate); this.put(")");
  }
  MemberExpression(n: MemberExpression) {
    if (needsParensForMemberObject(n.object)) {
      this.put("("); this.rec(n.object); this.put(")");
    } else
      this.rec(n.object);
    if (n.computed) {
      this.put(n.optional ? "?.[" : "["); this.rec(n.property); this.put("]");
    } else {
      this.put(n.optional ? "?." : "."); this.rec(n.property);
    }
  }
  identifierName(n: Identifier) {
    if (!this.djs || !n.symbolRef)
      return n.name;
    return toIdentifier(n.symbolRef.source, n.symbolRef.exportedName!);
  }
  Identifier(n: Identifier, emitMode: EmitMode = EmitMode.Binding) {
    if (emitMode == EmitMode.BindingTs && n.typeAnnotation) {
      this.put(this.identifierName(n));
      if (n.optional) this.put("?");
      this.put(": "); this.rec(n.typeAnnotation);
    } else if (emitMode == EmitMode.BindingJsDoc && n.typeAnnotation) {
      this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */ ");
      this.put(this.identifierName(n));
    } else if (emitMode == EmitMode.JsDocParamType && n.typeAnnotation) {
      this.rec(n.typeAnnotation);
      if (n.optional) this.put("=");
    } else
      this.put(this.identifierName(n));
  }
  functionExpression(
    n: FunctionExpression | ArrowFunctionExpression,
    emitMode: EmitMode = EmitMode.BindingJsDoc
  ) {
    const arrow = n.type.startsWith("Arrow");
    if (emitMode == EmitMode.BindingJsDoc && n.returnType) {
      const effects = hasAll(n.modifiers, Modifier.SideEffectFree) ? "@nosideeffects " : "";
      this.put(`/** ${effects}@return {`); this.rec(n.returnType); this.put("} */ ");
    }
    if (n.async) this.put("async ");
    this.put(arrow ? "(" : (n.generator ? "function* (" : "function ("));
    this.arr(n.params, ", ", emitMode);
    this.put(arrow ? ") => " : ") ");
    this.rec(n.body, null, /* wrapped */ true)
  }
  FunctionExpression(n: FunctionExpression, emitMode: EmitMode) { this.functionExpression(n, emitMode); }
  ArrowFunctionExpression(n: ArrowFunctionExpression, emitMode: EmitMode) { this.functionExpression(n, emitMode); }
  LogicalExpression(n: LogicalExpression) {
    this.put("("); this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); this.put(")");
  }
  SequenceExpression(n: SequenceExpression) { this.arr(n.expressions, ", "); }
  ObjectExpression(n: ObjectExpression, _: EmitMode, wrapped: boolean) {
    if (wrapped) this.put("("); this.put("{");
    this.inc(); this.arrLines(n.properties, ","); this.dec();
    if (n.properties.length) this.ret();
    this.put("}"); if (wrapped) this.put(")");
  }
  Property(n: Property) {
    if (n.method) {
      const method = n.value as FunctionExpression;
      this.jsDoc(method);
      if (method.async) this.put("async "); if (method.generator) this.put("*");
      this.rec(n.key);
      this.put("("); this.arr(method.params, ", "); this.put(") ");
      this.rec(method.body);
    } else if (!n.shorthand) {
      if (n.computed) {
        this.put("["); this.rec(n.key); this.put("]");
      } else if (n.key?.type == "Identifier")
        this.put(n.key.name);
      else
        this.rec(n.key);
      this.put(": "); this.rec(n.value);
    } else
      this.rec(n.value);
  }
  TemplateLiteral(n: TemplateLiteral) {
    this.put("`");
    for (let i = 0; i < n.quasis.length; ++i) {
      this.put(n.quasis[i].value.raw);
      if (i < n.expressions.length) {
        this.put("${"); this.rec(n.expressions[i]); this.put("}");
      }
    }
    this.put("`");
  }
  UnaryExpression(n: UnaryExpression) { this.put(n.operator); if (n.operator.length > 1) this.put(" "); this.rec(n.argument); }
  UpdateExpression(n: UpdateExpression) {
    if (n.prefix) this.put(n.operator); this.rec(n.argument); if (!n.prefix) this.put(n.operator);
  }
  NewExpression(n: NewExpression) {
    this.put("new "); this.rec(n.callee);
    this.put("("); this.arr(n.arguments, ", "); this.put(")");
  }
  SpreadElement(n: SpreadElement) { this.put("..."); this.rec(n.argument); }
  RestElement(n: RestElement, emitMode: EmitMode = EmitMode.Binding) {
    const inner = n.typeAnnotation?.typeAnnotation;
    const elementType = probeArrayLikeElementType(inner) || inner;
    if (emitMode == EmitMode.JsDocParamType && elementType) {
      this.put("..."); this.rec(elementType); return;
    }
    if (emitMode == EmitMode.BindingTs && n.typeAnnotation) {
      this.put("..."); this.rec(n.argument); this.put(": "); this.rec(n.typeAnnotation); return;
    }
    if (emitMode == EmitMode.BindingJsDoc && elementType) {
      this.put("/** @type {..."); this.rec(elementType); this.put("} */ ");
      this.rec(n.argument); return;
    }
    this.put("..."); this.rec(n.argument);
  }
  ImportExpression(n: ImportExpression) { this.put("import("); this.rec(n.source); this.put(")"); }
  AssignmentExpression(n: AssignmentExpression) { this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); }
  ThisExpression() { this.put("this"); }
  TaggedTemplateExpression(n: TaggedTemplateExpression) { this.rec(n.tag); this.rec(n.quasi); }
  Super() { this.put("super"); }

  // JS Statements
  EmptyStatement(n: EmptyStatement) {
    if (n.comment) this.put(`/* ${n.comment} */`);
  }
  ImportDeclaration(n: ImportDeclaration) {
    const specifiers = n.specifiers ?? [];
    let i = 0;
    this.put("import ");
    if (specifiers[0]?.type == "ImportDefaultSpecifier") {
      this.rec(specifiers[0]);
      i = 1;
    }
    if (specifiers[i]?.type == "ImportNamespaceSpecifier") {
      if (i > 0) this.put(", ");
      this.put("* as "); this.rec(specifiers[i].local);
      i++;
    }
    if (i < specifiers.length) {
      if (i > 0) this.put(", ");
      this.put("{ "); this.arr(specifiers.slice(i), ", "); this.put(" }");
    }
    this.put(" from "); this.rec(n.source); this.put(";");
  }
  ImportSpecifier(n: ImportSpecifier) {
    if (n.imported.type == "Identifier" && n.imported.name != n.local.name) {
      this.rec(n.imported); this.put(" as ");
    }
    this.rec(n.local);
  }
  ImportDefaultSpecifier(n: ImportDefaultSpecifier) { this.rec(n.local); }
  ExportNamedDeclaration(n: ExportNamedDeclaration) {
    if (n.declaration) {
      if (this.djs) { this.rec(n.declaration); return; }
      this.ret();
      this.put("export ");
      this.rec(n.declaration);
      return;
    }
    this.ret();
    if (n.specifiers.length < 3) {
      this.put("export { "); this.arr(n.specifiers, ", "); this.put(" };");
    } else {
      this.put("export {");
      this.inc(); this.arrLines(n.specifiers, ","); this.dec(); this.ret();
      this.put("};");
    }
  }
  ExportSpecifier(n: ExportSpecifier) {
    this.rec(n.local);
    if (n.local.type == "Identifier"
      && n.exported.type == "Identifier"
      && n.local.name != n.exported.name) { this.put(" as "); this.rec(n.exported); }
  }
  ExportDefaultDeclaration(n: ExportDefaultDeclaration) {
    this.put("export default ");
    this.rec(n.declaration);
    if (!n.declaration.type.endsWith("Declaration"))
      this.put(";");
  }
  ClassDeclaration(n: ClassDeclaration | ClassExpression) {
    if (n.implements || n.typeParameters) {
      this.doc();
      if (n.implements)
        for (const iface of n.implements) {
          this.ret(); this.put("@implements {"); this.rec(iface); this.put("}");
        }
      this.rec(n.typeParameters);
      this.cod();
    }
    this.put("class "); this.rec(n.id);
    if (n.superClass) { this.put(" extends "); this.rec(n.superClass); }
    this.put(" ");
    this.withTemplateScope(n.typeParameters, () => this.rec(n.body));
  }
  ClassExpression(n: ClassExpression) {
    this.put("("); this.inc(); this.ret();
    this.ClassDeclaration(n);
    this.dec(); this.put(")");
  }
  ClassBody(n: ClassBody) {
    this.put("{");
    this.inc();
    this.arrLines(n.body, "");
    this.dec(); if (n.body.length) this.ret();
    this.put("}");
  }
  MethodDefinition(n: MethodDefinition) {
    if (n.kind == "constructor") { this.ConstructorDefinition(n); return }
    n.value.modifiers |= n.modifiers | (n.override ? Modifier.Override : 0);
    n.value.typeParameters ||= n.typeParameters;
    this.jsDoc(n.value, n.value.modifiers);
    if (n.static) this.put("static ");
    if (n.value.async) this.put("async ");
    if (n.value.generator) this.put("*");
    this.rec(n.key); this.put("("); this.arr(n.value.params, ", "); this.put(") ");
    if (n.value.body) this.rec(n.value.body); else this.put("{}");
  }
  PropertyDefinition(n: PropertyDefinition) {
    this.jsDocType(n, n.modifiers);
    if (n.static) this.put("static "); this.rec(n.key);
    if (n.value) { this.put(" = "); this.rec(n.value); } this.put(";");
  }
  VariableDeclaration(n: VariableDeclaration) {
    n.modifiers |= n.kind == "const" ? Modifier.Readonly : 0;
    if (hasTypeJsDocModifiers(n.modifiers)) {
      if (n.declarations.length != 1)
        throw "A declaration with jsdoc modifiers must have a single declarator";
      this.rec(n.declarations[0], n.modifiers); return;
    }
    const [typed, untyped] = partition(n.declarations, genJsDocType);
    this.arrInner(typed, n.modifiers);
    if (untyped.length) {
      if (typed.length) this.ret();
      this.put(n.kind + " "); this.arr(untyped, ", "); this.put(";");
    }
  }
  /**
   * If modifiers is present, emitted as a VariableDeclaration otherwise,
   * emitted as a VariableDeclarator.
   */
  VariableDeclarator(n: VariableDeclarator, modifiers?: Modifier) {
    if (modifiers != undefined) {
      modifiers |= n.modifiers ?? 0;
      const isFunctionDecl = n.init && n.init.type.endsWith("FunctionExpression");
      if (isFunctionDecl)
        this.jsDoc(n.init as FunctionExpression | ArrowFunctionExpression, modifiers);
      else
        this.jsDocType(n.id, modifiers);
      this.put((modifiers & Modifier.Readonly) ? "const " : "let "); this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init, isFunctionDecl ? EmitMode.Binding : undefined); }
      this.put(";");
    } else {
      this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init); }
    }
  }
  FunctionDeclaration(n: FunctionDeclaration) {
    this.jsDoc(n, n.modifiers);
    if (n.async) this.put("async "); this.put(n.generator ? "function* " : "function ");
    this.rec(n.id); this.put("("); this.arr(n.params, ", "); this.put(") ");
    this.rec(n.body);
  }
  ArrayPattern(n: ArrayPattern, emitMode: EmitMode = EmitMode.Binding) {
    if (emitMode == EmitMode.JsDocParamType && n.typeAnnotation) {
      this.rec(n.typeAnnotation); return;
    }
    if (emitMode == EmitMode.BindingJsDoc && n.typeAnnotation) {
      this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */ ");
    }
    this.put("["); this.arr(n.elements, ", "); this.put("]");
    if (emitMode == EmitMode.BindingTs && n.typeAnnotation) {
      if (n.optional) this.put("?"); this.put(": "); this.rec(n.typeAnnotation);
    }
  }
  ObjectPattern(n: ObjectPattern, emitMode: EmitMode = EmitMode.Binding) {
    if (emitMode == EmitMode.JsDocParamType && n.typeAnnotation) {
      this.rec(n.typeAnnotation); return;
    }
    if (emitMode == EmitMode.BindingJsDoc && n.typeAnnotation) {
      this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */ ");
    }
    this.put("{ "); this.arr(n.properties, ", "); this.put(" }");
    if (emitMode == EmitMode.BindingTs && n.typeAnnotation) {
      if (n.optional) this.put("?"); this.put(": "); this.rec(n.typeAnnotation);
    }
  }
  AssignmentPattern(n: AssignmentPattern, emitMode: EmitMode = EmitMode.Binding) {
    if (emitMode == EmitMode.JsDocParamType) {
      this.rec(n.left.typeAnnotation || probeExpressionType(n.right), emitMode);
      this.put("=");
    } else {
      this.rec(n.left, emitMode); this.put(" = "); this.rec(n.right);
    }
  }
  ContinueStatement(n: ContinueStatement) {
    this.put("continue"); if (n.label) { this.put(" "); this.rec(n.label); } this.put(";");
  }
  BreakStatement(n: BreakStatement) {
    this.put("break"); if (n.label) { this.put(" "); this.rec(n.label); } this.put(";");
  }
  ExpressionStatement(n: ExpressionStatement) {
    const wrap = wrapExpression(n.expression);
    if (wrap) this.put("("); this.rec(n.expression); if (wrap) this.put(")"); this.put(";");
  }
  ThrowStatement(n: ThrowStatement) { this.put("throw "); this.rec(n.argument); this.put(";"); }
  IfStatement(n: IfStatement) {
    this.put("if ("); this.rec(n.test); this.put(")");
    this.blockLike(n.consequent);
    if (n.alternate) {
      if (n.consequent.type == "BlockStatement") this.put(" "); else this.ret();
      this.put("else"); this.blockLike(n.alternate, true);
    }
  }
  ForStatement(n: ForStatement) {
    this.put("for ("); this.rec(n.init); this.ens(";"); this.put(" ");
    this.rec(n.test); this.put("; "); this.rec(n.update);
    this.put(")");
    this.blockLike(n.body);
  }
  ForOfStatement(n: ForOfStatement | ForInStatement, of = " of ") {
    this.put("for "); if (n.type == "ForOfStatement" && n.await) this.put("await ");
    this.put("("); this.rec(n.left); this.del(); this.put(of); this.rec(n.right); this.put(")");
    this.blockLike(n.body);
  }
  ForInStatement(n: ForInStatement) { this.ForOfStatement(n, " in "); }
  WhileStatement(n: WhileStatement) {
    this.put("while ("); this.rec(n.test); this.put(")"); this.blockLike(n.body);
  }
  ReturnStatement(n: ReturnStatement) { this.put("return "); this.rec(n.argument); this.put(";"); }
  SwitchStatement(n: SwitchStatement) {
    this.put("switch ("); this.rec(n.discriminant); this.put(") {");
    this.inc(); this.arrLines(n.cases, ""); this.dec();
    this.ret(); this.put("}");
  }
  TryStatement(n: TryStatement) {
    this.put("try "); this.rec(n.block);
    if (n.handler) this.rec(n.handler);
    if (n.finalizer) this.rec(n.finalizer);
  }
  CatchClause(n: CatchClause) {
    this.put(" catch ");
    if (n.param) { this.put("("); this.rec(n.param); this.put(") "); }
    this.rec(n.body);
  }
  SwitchCase(n: SwitchCase) {
    if (n.test) { this.put("case "); this.rec(n.test); } else this.put("default");
    this.put(":");
    this.inc(); this.arrLines(n.consequent, ""); this.dec();
  }
  BlockStatement(n: BlockStatement) {
    this.put("{");
    this.inc(); this.arrLines(n.body, ""); this.dec(); if (n.body.length) this.ret();
    this.put("}");
  }
  Program(n: Program) { this.arrInner(n.body); this.ret(); }

  // Helpers
  blockLike(n: Node, allowIf?: boolean) {
    if (n.type == "BlockStatement" || (allowIf && n.type == "IfStatement")) {
      this.put(" "); this.rec(n);
    } else {
      this.inc(); this.ret(); this.rec(n); this.dec();
    }
  }

  // KDJS jsdoc
  jsDocType(n: JsDocTypeTarget, modifiers = 0) {
    n.typeAnnotation ||= probeExpressionType(n.value);
    const tag = usesConstJsDoc(modifiers) ? "const" : "type";
    if (!hasMultiLineTypeJsDocModifiers(modifiers)) {
      if (!n.typeAnnotation) {
        if (modifiers & Modifier.ClosureNamespace) { this.put("/** @const */"); this.ret(); }
        return;
      }
      this.put(`/** @${tag} {`); this.rec(n.typeAnnotation); this.put("} */"); this.ret();
    } else {
      if (!n.typeAnnotation && !(modifiers & (Modifier.NoInline | Modifier.ClosureNamespace)))
        return;
      this.doc();
      if (modifiers & Modifier.NoInline) { this.ret(); this.put("@noinline"); }
      if (n.typeAnnotation) {
        this.put(`@${tag} {`, true); this.rec(n.typeAnnotation); this.put("}");
      } else if (modifiers & Modifier.ClosureNamespace)
        this.put("@const", true);
      this.cod();
    }
  }
  jsDoc(n: JsDocTarget, modifiers = 0) {
    const params: TSParameter[] = n.params || n.parameters || [];
    const retType = n.returnType || n.typeAnnotation;
    this.doc();
    if (n.typeParameters && !this.djs)
      this.put("@suppress {reportUnknownTypes}", true);
    this.rec(n.typeParameters);
    if (n.returnType?.typeAnnotation?.type == "TSConditionalType")
      this.put(`@template RETURN := ${conditionalType(n.returnType, {
        djs: this.djs,
        templateNames: this.currentTemplateNames(n.typeParameters)
      })} =:`, true)
    if (modifiers & Modifier.Override)
      this.put("@override", true);
    if (modifiers & Modifier.NoInline)
      this.put("@noinline", true);
    if (hasAll(modifiers, Modifier.SideEffectFree))
      this.put("@nosideeffects", true);
    if (modifiers & Modifier.Inline)
      this.put("@requireInlining", true);
    if (modifiers & Modifier.InlineFriendly)
      this.put("@encourageInlining", true);

    let i = 0;
    for (let param of params) {
      const name = jsDocParamName(param);
      this.ret();
      this.put("@param {"); this.rec(param, EmitMode.JsDocParamType); this.put("} ");
      if (name) this.rec(name); else this.put(`arg${i++}`);
    }
    if (retType) { this.ret(); this.put("@return {"); this.rec(retType); this.put("}"); }
    this.cod();
  }
  // Handles classes with explicity constructor, and potentially
  // `TSParameterProperty`'s and `Property`'s.
  // TODO(KimlikDAO-bot): do this properly. we need prop deduping
  ConstructorDefinition(n: MethodDefinition) {
    const params: TSParameter[] = n.value.params;
    this.jsDoc(n.value);
    this.put("constructor("); this.arr(params, ", "); this.put(")");
    this.put(" {"); this.inc();
    const body = n.value.body?.body;
    if (body) this.arrLines(body, "");
    for (let param of params)
      if (param.type == "TSParameterProperty") {
        const modifiers = param.readonly ? Modifier.Readonly : 0;
        param = param.parameter;
        if (param.type == "AssignmentPattern")
          param = param.left;
        this.ret();
        this.jsDocType(param, modifiers);
        this.put("this."); this.rec(param);
        this.put(" = "); this.rec(param); this.put(";");
      }
    this.dec(); this.ret();
    this.put("}")
  }
}

const generate = (node: Node, options?: { djs?: boolean }): string => {
  const g = new GccGenerator(options?.djs);
  g.rec(node);
  return g.out;
}

export {
  EmitMode,
  GccGenerator,
  generate,
  generateAliasImports,
  generateEsmImports,
  toIdentifier
};

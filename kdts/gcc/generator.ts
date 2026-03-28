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
  ReturnStatement,
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
  WhileStatement
} from "acorn";
import { partition } from "../../util/arrays";
import { isIdentifier } from "../ast/guards";
import {
  TSArrayType,
  TSAsExpression,
  TSConstructorType,
  TSDeclareFunction,
  TSEnumDeclaration,
  TSEnumMember,
  TSExpressionWithTypeArguments,
  TSFunctionType,
  TSInterfaceBody,
  TSInterfaceDeclaration,
  TSLiteralType,
  TSMethodSignature,
  TSNonNullExpression,
  TSParameter,
  TSParameterProperty,
  TSParenthesizedType,
  TSPropertySignature,
  TSQualifiedName,
  TSSatisfiesExpression,
  TSTupleType,
  TSTypeAliasDeclaration,
  TSTypeAnnotation,
  TSTypeLiteral,
  TSTypeOperator,
  TSTypeParameter,
  TSTypeParameterInstantiation,
  TSTypeQuery,
  TSTypeReference,
  TSUnionType
} from "../ast/types";
import { Generator } from "../ast/walk";
import { Modifier } from "../model/modifier";
import { ModuleImports, SourceId } from "../model/moduleImport";
import {
  inferEnumType,
  inferFromExpression
} from "../transform/inference";
import { conditionalType } from "./ttlGenerator";

const toIdentifier = (source: SourceId, name: string): string => {
  const text = `kdts$$${source}$${name == "*" ? "star" : name}`;
  const value = text.replaceAll(
    /[^A-Za-z0-9_$]/g,
    (char) => (char == "." || char == "-") ? "_" : "$"
  );
  return (value[0] >= "0" && value[0] <= "9") ? "_" + value : value;
};

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

  for (const source of Object.keys(groups).sort() as SourceId[]) {
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

const IdentifierTypes = {
  None: 0,
  JsDoc: 1,
  Ts: 2,
  Param: 3
} as const;

type IdentifierType = typeof IdentifierTypes[keyof typeof IdentifierTypes];
type KdjsImportSpecifier = ImportSpecifier & { imported: Identifier; local: Identifier };
type KdjsExportSpecifier = ExportSpecifier & { local: Identifier; exported: Identifier };
type KdjsProperty =
  | (Property & { method: true; value: FunctionExpression })
  | (Property & { method: false; value: Node });
type JsDocTypeTarget = { typeAnnotation?: TSTypeAnnotation | null; value?: Node | null; };
type JsDocTarget = {
  params?: TSParameter[];
  parameters?: TSParameter[];
  returnType?: TSTypeAnnotation | null;
  typeAnnotation?: TSTypeAnnotation | null;
  typeParameters?: { params: TSTypeParameter[] } | null;
};

const genJsDocType = (d: VariableDeclarator) => d.id.typeAnnotation ||
  d.init && d.init.type.endsWith("FunctionExpression");

const wrapExpression = (expr?: Node | null) =>
  expr?.type == "AssignmentExpression" && (expr as AssignmentExpression).left?.type == "ObjectPattern";

/** True when this expression must be wrapped in () when used as the object of a MemberExpression. */
const needsParensForMemberObject = (node?: Node | null) =>
  node?.type == "AssignmentExpression" || node?.type == "SequenceExpression";

const entityNameText = (node: Identifier | TSQualifiedName): string =>
  isIdentifier(node) ? node.name : `${entityNameText(node.left)}.${node.right.name}`;

/**
 * Rest parameters are typed as T[], readonly T[], Array<T>, or ReadonlyArray<T>.
 * JSDoc @param {...T} needs the element type T only.
 */
const unwrapArrayElementType = (n?: Node | null): Node | void => {
  if (!n) return;
  if (n.type == "TSArrayType")
    return (n as TSArrayType).elementType;
  if (n.type == "TSTypeOperator" && (n as TSTypeOperator).operator == "readonly")
    return unwrapArrayElementType((n as TSTypeOperator).typeAnnotation);
  if (n.type == "TSTypeReference" && (n as TSTypeReference).typeArguments?.params?.length) {
    const ref = n as TSTypeReference;
    const id = entityNameText(ref.typeName);
    if (id == "ReadonlyArray" || id == "Array")
      return ref.typeArguments?.params[0];
  }
};

class GccGenerator extends Generator {
  constructor(readonly djs: boolean = false) { super(); }

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

  // TS Type expressions
  TSArrayType(n: TSArrayType) { this.put("!Array<"); this.rec(n.elementType); this.put(">"); }
  TSAsExpression(n: TSAsExpression) {
    this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */(");
    this.rec(n.expression);
    this.put(")");
  }
  TSSatisfiesExpression(n: TSSatisfiesExpression) {
    if (n.typeAnnotation?.typeName?.name == "PureExpr") {
      this.put("/** @pureOrBreakMyCode */("); this.rec(n.expression); this.put(")");
    } else
      this.rec(n.expression);
  }
  TSNonNullExpression(n: TSNonNullExpression) { this.rec(n.expression); }
  TSFunctionType(n: TSFunctionType) {
    this.put("function("); this.arr(n.parameters, ", ", IdentifierTypes.Param); this.put("):");
    this.rec(n.typeAnnotation);
  }
  TSConstructorType(n: TSConstructorType) {
    this.put("function(new:"); this.rec(n.typeAnnotation); this.put(", ");
    this.arr(n.parameters, ", ", IdentifierTypes.Param);
  }
  TSConditionalType() { this.put("OUT"); }
  TSLiteralType(n: TSLiteralType) { this.put(typeof n.literal.value); }
  TSParenthesizedType(n: TSParenthesizedType) {
    this.put("("); this.rec(n.typeAnnotation); this.put(")");
  }
  TSTupleType(n: TSTupleType) { this.put("!Array<"); this.rec(n.elementTypes[0]); this.put(">"); }
  TSUnionType(n: TSUnionType) { this.put("("); this.arr(n.types, "|"); this.put(")"); }
  TSQualifiedName(n: TSQualifiedName) { this.rec(n.left); this.put("." + n.right.name); }
  TSTypeAnnotation(n: TSTypeAnnotation) { this.rec(n.typeAnnotation); }
  TSTypeLiteral(n: TSTypeLiteral) {
    this.put("{");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("}");
  }
  TSTypeOperator(n: TSTypeOperator) { this.put(n.operator + " "); this.rec(n.typeAnnotation); }
  TSTypeQuery(n: TSTypeQuery) { this.put("typeof "); this.rec(n.exprName); }
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
    const type = inferEnumType(n);
    this.put(`/** @enum {${type}} */`); this.ret();
    this.put("const "); this.rec(n.id); this.put(" = {");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("};");
  }
  TSEnumMember(n: TSEnumMember) { this.rec(n.id); this.put(": "); this.rec(n.initializer); }
  TSTypeAliasDeclaration(n: TSTypeAliasDeclaration) {
    this.doc(); this.ret();
    this.put("@typedef {"); this.rec(n.typeAnnotation); this.put("}");
    this.cod();
    this.put("const "); this.rec(n.id); this.put(" = {};");
  }
  TSInterfaceDeclaration(n: TSInterfaceDeclaration) {
    this.doc(); this.ret();
    this.put("@interface");
    if (n.extends)
      for (const iface of n.extends) {
        this.ret(); this.put("@extends {"); this.rec(iface); this.put("}")
      }
    if (n.typeParameters) {
      this.ret(); this.put("@template ")
      this.arr(n.typeParameters.params, ", ");
    }
    this.cod();
    this.put("class "); this.rec(n.id); this.put(" "); this.rec(n.body);
  }
  TSInterfaceBody(n: TSInterfaceBody) {
    this.put("{"); this.inc();
    this.arrLines(n.body, "", /* inInterface */ true);
    this.dec(); this.ret(); this.put("}");
  }
  TSMethodSignature(n: TSMethodSignature) {
    this.jsDoc(n, n.modifiers);
    this.rec(n.key); this.put("("); this.arr(n.parameters, ", "); this.put(") {}");
  }
  TSPropertySignature(n: TSPropertySignature, inInterface?: boolean) {
    if (inInterface) {
      this.jsDocType(n, 0); this.rec(n.key); this.put(";");
    } else {
      this.rec(n.key); this.put(": ");
      if (n.optional) this.put("("); this.rec(n.typeAnnotation); if (n.optional) this.put("|undefined)");
    }
  }
  TSParameterProperty(n: TSParameterProperty) { this.rec(n.parameter); }
  TSDeclareFunction(n: TSDeclareFunction) {
    this.jsDoc(n);
    this.put("function "); this.rec(n.id); this.put("("); this.arr(n.params, ", "); this.put(") ");
    this.put("{}");
  }

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
  Identifier(n: Identifier, showTypes?: IdentifierType) {
    if (showTypes == IdentifierTypes.Ts && n.typeAnnotation) {
      this.put(this.identifierName(n));
      if (n.optional) this.put("?");
      this.put(": "); this.rec(n.typeAnnotation);
    } else if (showTypes == IdentifierTypes.JsDoc && n.typeAnnotation) {
      this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */ ");
      this.put(this.identifierName(n));
    } else if (showTypes == IdentifierTypes.Param && n.typeAnnotation)
      this.rec(n.typeAnnotation);
    else
      this.put(this.identifierName(n));
  }
  FunctionExpression(n: FunctionExpression, showTypes?: IdentifierType) {
    if (showTypes == undefined) showTypes = IdentifierTypes.JsDoc;
    if (showTypes == IdentifierTypes.JsDoc && n.returnType) {
      this.put("/** @return {"); this.rec(n.returnType); this.put("} */ ");
    }
    if (n.async) this.put("async ");
    this.put("function ("); this.arr(n.params, ", ", showTypes); this.put(") ");
    this.rec(n.body, null, /* wrapped */ true)
  }
  ArrowFunctionExpression(n: ArrowFunctionExpression, showTypes?: IdentifierType) {
    // By default, show types in the inlineJsDoc format
    // If we've already printed the types in the jsDoc format, omit them.
    if (showTypes == undefined) showTypes = IdentifierTypes.JsDoc;
    if (showTypes == IdentifierTypes.JsDoc && n.returnType) {
      this.put("/** @return {"); this.rec(n.returnType); this.put("} */ ");
    }
    if (n.async) this.put("async ");
    this.put("("); this.arr(n.params, ", ", showTypes); this.put(") => ");
    this.rec(n.body, null, /* wrapped */ true)
  }
  LogicalExpression(n: LogicalExpression) {
    this.put("("); this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); this.put(")");
  }
  SequenceExpression(n: SequenceExpression) { this.arr(n.expressions, ", "); }
  ObjectExpression(n: ObjectExpression, _?: unknown, wrapped?: boolean) {
    if (wrapped) this.put("("); this.put("{");
    this.inc(); this.arrLines(n.properties, ","); this.dec();
    if (n.properties.length) this.ret();
    this.put("}"); if (wrapped) this.put(")");
  }
  Property(n: KdjsProperty) {
    if (n.method) {
      this.jsDoc(n.value);
      if (n.value.async) this.put("async "); this.rec(n.key);
      this.put("("); this.arr(n.value.params, ", "); this.put(") ");
      this.rec(n.value.body);
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
  RestElement(n: RestElement, showTypes?: IdentifierType) {
    this.put("..."); this.rec(n.argument);
    if (showTypes == IdentifierTypes.Ts && n.typeAnnotation) {
      this.put(": "); this.rec(n.typeAnnotation);
    }
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
  ImportSpecifier(n: KdjsImportSpecifier) {
    if (n.imported.name != n.local.name) { this.rec(n.imported); this.put(" as "); }
    this.rec(n.local);
  }
  ImportDefaultSpecifier(n: ImportDefaultSpecifier) { this.rec(n.local); }
  ExportNamedDeclaration(n: ExportNamedDeclaration) {
    if (this.djs && n.declaration) { this.rec(n.declaration); return; }
    this.ret();
    if (n.specifiers.length < 3) {
      this.put("export { "); this.arr(n.specifiers, ", "); this.put(" };");
    } else {
      this.put("export {");
      this.inc(); this.arrLines(n.specifiers, ","); this.dec(); this.ret();
      this.put("};");
    }
  }
  ExportSpecifier(n: KdjsExportSpecifier) {
    this.rec(n.local);
    if (n.local.name != n.exported.name) { this.put(" as "); this.rec(n.exported); }
  }
  ExportDefaultDeclaration(n: ExportDefaultDeclaration) { this.put("export default "); this.rec(n.declaration); }
  ClassDeclaration(n: ClassDeclaration | ClassExpression) {
    if (n.implements || n.typeParameters) {
      this.doc();
      if (n.implements)
        for (const iface of n.implements) {
          this.ret(); this.put("@implements {"); this.rec(iface); this.put("}");
        }
      if (n.typeParameters) {
        this.ret(); this.put("@template ");
        this.arr(n.typeParameters.params, ", ");
      }
      this.cod();
    }
    this.put("class "); this.rec(n.id);
    if (n.superClass) { this.put(" extends "); this.rec(n.superClass); }
    this.put(" "); this.rec(n.body);
  }
  ClassExpression(n: ClassExpression) {
    this.put("("); this.inc(); this.ret();
    this.ClassDeclaration(n);
    this.dec(); this.put(")");
  }
  ClassBody(n: ClassBody) {
    this.put("{"); this.inc();
    this.arrLines(n.body, "");
    this.dec(); this.ret(); this.put("}");
  }
  MethodDefinition(n: MethodDefinition) {
    if (n.kind == "constructor") { this.ConstructorDefinition(n); return }
    n.value.modifiers |= n.modifiers | (n.override ? Modifier.Override : 0);
    n.value.typeParameters ||= n.typeParameters;
    this.jsDoc(n.value, n.value.modifiers);
    if (n.static) this.put("static "); if (n.value.async) this.put("async ");
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
    if (n.modifiers > Modifier.Readonly) {
      if (n.declarations.length != 1)
        throw "A declaration with jsdoc modifiers must have a single declarator";
      if (n.modifiers & Modifier.Define && !n.declarations[0].id.typeAnnotation)
        throw "A @define variable declaration must have an explicit type annotation";
      this.rec(n.declarations[0], n.modifiers); return;
    }
    const [typed, untyped] = partition(n.declarations, (d) => !!genJsDocType(d));
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
      const isFunctionDecl = n.init && n.init.type.endsWith("FunctionExpression");
      if (isFunctionDecl) this.jsDoc(n.init as FunctionExpression | ArrowFunctionExpression, modifiers); else this.jsDocType(n.id, modifiers);
      this.put((modifiers & Modifier.Readonly) ? "const " : "let "); this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init, isFunctionDecl ? IdentifierTypes.None : undefined); }
      this.put(";");
    } else {
      this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init); }
    }
  }
  FunctionDeclaration(n: FunctionDeclaration) {
    this.jsDoc(n);
    this.put("function "); this.rec(n.id); this.put("("); this.arr(n.params, ", "); this.put(") ");
    this.rec(n.body);
  }
  ArrayPattern(n: ArrayPattern) { this.put("["); this.arr(n.elements, ", "); this.put("]"); }
  ObjectPattern(n: ObjectPattern) { this.put("{ "); this.arr(n.properties, ", "); this.put(" }"); }
  AssignmentPattern(n: AssignmentPattern) { this.rec(n.left); this.put(" = "); this.rec(n.right); }
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
    this.inc(); this.arrLines(n.body, ""); this.dec(); this.ret();
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
    n.typeAnnotation ||= inferFromExpression(n.value);
    const tag = (modifiers & Modifier.Define)
      ? "define" : (modifiers & Modifier.Readonly) ? "const" : "type";
    if (modifiers <= (Modifier.Define | Modifier.Readonly)) {
      if (!n.typeAnnotation) return;
      this.put(`/** @${tag} {`); this.rec(n.typeAnnotation); this.put("} */"); this.ret();
    } else {
      if (!n.typeAnnotation && !(modifiers & Modifier.NoInline)) return;
      this.doc();
      if (modifiers & Modifier.NoInline) { this.ret(); this.put("@noinline"); }
      if (n.typeAnnotation) { this.ret(); this.put(`@${tag} {`); this.rec(n.typeAnnotation); this.put("}"); }
      this.cod();
    }
  }
  jsDoc(n: JsDocTarget, modifiers = 0) {
    const params: TSParameter[] = n.params || n.parameters || [];
    const retType = n.returnType || n.typeAnnotation;
    this.doc();
    if (n.typeParameters) {
      // Inside the templated function, the template parameter is treated as
      // unknown, as there is no template narrowing in gcc.
      if (!this.djs) { this.ret(); this.put("@suppress {reportUnknownTypes}"); }
      this.ret(); this.put("@template ")
      this.arr(n.typeParameters.params, ", ");
      if (n.returnType?.typeAnnotation?.type == "TSConditionalType") {
        this.ret(); this.put(`@template OUT := ${conditionalType(n.returnType, { djs: this.djs })} =:`)
      }
    }
    if (modifiers & Modifier.Override) { this.ret(); this.put("@override"); }
    if (modifiers & Modifier.NoInline) { this.ret(); this.put("@noinline"); }
    if (modifiers & Modifier.NoSideEffects) { this.ret(); this.put("@nosideeffects"); }
    let i = 0;
    for (let param of params) {
      let isOptional = "optional" in param;
      let isRest = false;
      let typeAnnotation: Node | undefined;
      if (param.type == "TSParameterProperty")
        param = param.parameter;
      if (param.type == "AssignmentPattern") {
        param.left.typeAnnotation ||= inferFromExpression(param.right);
        isOptional = true;
        param = param.left;
      }
      if (param.type == "RestElement") {
        isRest = true;
        const inner = param.typeAnnotation?.typeAnnotation;
        typeAnnotation = unwrapArrayElementType(inner) || inner;
        param = param.argument;
      }
      this.ret();
      this.put("@param {");
      if (isRest) this.put("...");
      this.rec(typeAnnotation ?? param.typeAnnotation);
      if (isOptional) this.put("="); this.put("} ");
      if (param.type == "Identifier") { this.rec(param); } else { this.put(`arg${i++}`); }
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
  IdentifierTypes,
  GccGenerator,
  generate,
  generateAliasImports,
  generateEsmImports,
  toIdentifier
};

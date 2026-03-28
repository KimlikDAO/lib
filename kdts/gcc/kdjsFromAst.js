import { partition } from "../../util/arrays";
import { Modifier } from "../model/modifier";
import {
  inferEnumType,
  inferFromExpression
} from "../transform/inference";
import { toIdentifier } from "./generator";
import { partitionBody } from "./interfaces";
import { conditionalType } from "./ttlGenerator";

/** @enum {number} */
const IdentifierTypes = {
  None: 0,
  JsDoc: 1,
  Ts: 2
};

/**
 * Predicate to decide whether we should generate a jsDocType for a
 * VariableDeclaration.
 *
 * @return {boolean}
 */
const genJsDocType = (d) => d.id.typeAnnotation ||
  d.init && d.init.type.endsWith("FunctionExpression");

const wrapExpression = (expr) =>
  expr?.type == "AssignmentExpression" && expr.left?.type == "ObjectPattern";

/** True when this expression must be wrapped in () when used as the object of a MemberExpression. */
const needsParensForMemberObject = (node) =>
  node?.type == "AssignmentExpression" || node?.type == "SequenceExpression";

/**
 * Rest parameters are typed as T[], readonly T[], Array<T>, or ReadonlyArray<T>.
 * JSDoc @param {...T} needs the element type T only.
 *
 * @param {object|undefined} n TS type node (e.g. TSTypeAnnotation.typeAnnotation)
 * @return {object|undefined} element type, or undefined if not a known array form
 */
const unwrapArrayElementType = (n) => {
  if (!n) return;
  if (n.type == "TSArrayType")
    return n.elementType;
  if (n.type == "TSTypeOperator" && n.operator == "readonly")
    return unwrapArrayElementType(n.typeAnnotation);
  if (n.type == "TSTypeReference" && n.typeArguments?.params?.length) {
    const id = n.typeName?.name
      ?? (n.typeName?.type == "Identifier" ? n.typeName.name : null);
    if (id == "ReadonlyArray" || id == "Array")
      return n.typeArguments.params[0];
  }
};

class Generator {
  indent = "";
  out = "";
  constructor(options = {}) { this.djs = options.djs; }

  inc() { this.indent += "  "; }
  dec() { this.indent = this.indent.slice(0, -2); }
  ret(c) { this.out += (c ?? "") + "\n" + this.indent; }
  put(s) { this.out += s; }
  ens(s) { if (!this.out.endsWith(s)) this.out += s; }
  del() { this.out = this.out.slice(0, -1); }
  doc() { this.indent += " * "; this.out += "/**"; }
  cod() {
    const ind = this.indent = this.indent.slice(0, -3);
    this.out += "\n" + ind + " */\n" + ind;
  }
  rec(n, ...rest) {
    if (n && typeof this[n.type] == "function")
      this[n.type](n, ...rest);
    else if (n)
      console.log("No method for node type:", n.type, n);
  }
  arr(a, sep, ...rest) {
    let s = "";
    for (const x of a) {
      s ? this.put(s) : s = sep;
      this.rec(x, ...rest);
    }
  }
  arrLines(a, sep, ...rest) {
    let s = "";
    for (const x of a) {
      s ? this.put(s) : s = sep
      this.ret(); this.rec(x, ...rest);
    }
  }
  arrInner(a, ...rest) {
    let first = true;
    for (const x of a) {
      if (first) first = false; else this.ret();
      this.rec(x, ...rest);
    }
  }

  TSStringKeyword() { this.put("string"); }
  TSNumberKeyword() { this.put("number"); }
  TSBooleanKeyword() { this.put("boolean"); }
  TSBigIntKeyword() { this.put("bigint"); }
  TSAnyKeyword() { this.put("any"); }
  TSUnknownKeyword() { this.put("unknown"); }
  TSVoidKeyword() { this.put("void"); }
  TSNullKeyword() { this.put("null"); }
  TSUndefinedKeyword() { this.put("undefined"); }
  TSObjectKeyword() { this.put("Object"); }
  TSNeverKeyword() { this.put("void"); }

  // TS Type expressions
  TSArrayType(n) { this.rec(n.elementType); this.put("[]"); }
  TSAsExpression(n) {
    this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */(");
    this.rec(n.expression);
    this.put(")");
  }
  TSSatisfiesExpression(n) {
    if (n.typeAnnotation?.typeName?.name == "PureExpr") {
      this.put("/** @pureOrBreakMyCode */("); this.rec(n.expression); this.put(")");
    } else
      this.rec(n.expression);
  }
  TSNonNullExpression(n) { this.rec(n.expression); }
  TSFunctionType(n) {
    this.put("("); this.arr(n.parameters, ", ", IdentifierTypes.Ts); this.put(") => ");
    this.rec(n.typeAnnotation);
  }
  TSConstructorType(n) {
    this.put("new "); this.TSFunctionType(n);
  }
  TSConditionalType(n) { this.put("OUT"); }
  TSLiteralType(n) { this.put(typeof n.literal.value); }
  TSParenthesizedType(n) { this.put("("); this.rec(n.typeAnnotation); this.put(")"); }
  TSTupleType(n) { this.rec(n.elementTypes[0]); this.put("[]"); } // TODO() throw if multiple types
  TSUnionType(n) { this.arr(n.types, " | "); }
  TSQualifiedName(n) { this.rec(n.left); this.put("." + n.right.name); }
  TSTypeAnnotation(n) { this.rec(n.typeAnnotation); }
  TSTypeLiteral(n) {
    this.put("{");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("}");
  }
  TSTypeOperator(n) { this.put(n.operator + " "); this.rec(n.typeAnnotation); }
  TSTypeQuery(n) { this.put("typeof "); this.rec(n.exprName); }
  TSTypeParameter(n) { this.put(n.name); }
  TSTypeParameterInstantiation(n) { this.put("<"); this.arr(n.params, ", "); this.put(">"); }
  TSTypeReference(n) { this.rec(n.typeName); this.rec(n.typeArguments); }
  TSExpressionWithTypeArguments(n) {
    this.rec(n.expression);
    this.rec(n.typeArguments || n.typeParameters);
  }

  // TS Declarations
  TSEnumDeclaration(n) {
    const type = inferEnumType(n);
    this.put(`/** @enum {${type}} */`); this.ret();
    this.put("const "); this.rec(n.id); this.put(" = {");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("};");
  }
  TSEnumMember(n) { this.rec(n.id); this.put(": "); this.rec(n.initializer); }
  TSTypeAliasDeclaration(n) {
    this.doc(); this.ret();
    this.put("@typedef {"); this.rec(n.typeAnnotation); this.put("}");
    this.cod();
    this.put("const "); this.rec(n.id); this.put(" = {};");
  }
  TSInterfaceDeclaration(n) {
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
  TSInterfaceBody(n) {
    if (this.djs) { this.DJSInterfaceBody(n); return; }
    this.put("{"); this.inc();
    this.arrLines(n.body, "", /* inInterface */ true);
    this.dec(); this.ret(); this.put("}");
  }
  TSMethodSignature(n) {
    this.jsDoc(n, n.modifiers);
    this.rec(n.key); this.put("("); this.arr(n.parameters, ", "); this.put(") {}");
  }
  TSPropertySignature(n, inInterface) {
    if (inInterface) {
      this.jsDocType(n, 0); this.rec(n.key); this.put(";");
    } else {
      this.rec(n.key); if (n.optional) this.put("?"); this.put(": "); this.rec(n.typeAnnotation);
    }
  }
  TSParameterProperty(n) { this.rec(n.parameter); }
  TSDeclareFunction(n) {
    this.jsDoc(n);
    this.put("function "); this.rec(n.id); this.put("("); this.arr(n.params, ", "); this.put(") ");
    this.put("{}");
  }

  // JS Expressions
  Literal(n) { this.put(n.raw); }
  ArrayExpression(n) {
    this.put("[");
    if (n.elements.length > 4) {
      this.inc(); this.arrLines(n.elements, ","); this.dec(); this.ret();
    } else {
      this.arr(n.elements, ", ");
    }
    this.put("]");
  }
  AwaitExpression(n) { this.put("await "); this.rec(n.argument); }
  BinaryExpression(n) {
    this.put("("); this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); this.put(")");
  }
  CallExpression(n) {
    const wrap = n.callee.type == "ArrowFunctionExpression";
    if (wrap) this.put("(");
    this.rec(n.callee);
    if (n.optional) this.put("?.");
    if (wrap) this.put(")");
    this.put("("); this.arr(n.arguments, ", "); this.put(")");
  }
  ParenthesizedExpression(n) {
    this.put("("); this.rec(n.expression); this.put(")");
  }
  ChainExpression(n) { this.rec(n.expression); }
  ConditionalExpression(n) {
    this.put("("); this.rec(n.test); this.put(" ? ");
    this.rec(n.consequent); this.put(" : "); this.rec(n.alternate); this.put(")");
  }
  MemberExpression(n) {
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
  identifierName(n) {
    if (!this.djs || !n.symbolRef)
      return n.name;
    return toIdentifier(n.symbolRef.source, n.symbolRef.exportedName);
  }
  Identifier(n, showTypes) {
    if (showTypes == IdentifierTypes.Ts && n.typeAnnotation) {
      this.put(this.identifierName(n));
      if (n.optional) this.put("?");
      this.put(": "); this.rec(n.typeAnnotation);
    } else if (showTypes == IdentifierTypes.JsDoc && n.typeAnnotation) {
      this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */ ");
      this.put(this.identifierName(n));
    } else
      this.put(this.identifierName(n));
  }
  FunctionExpression(n, showTypes) {
    if (showTypes == undefined) showTypes = IdentifierTypes.JsDoc;
    if (showTypes == IdentifierTypes.JsDoc && n.returnType) {
      this.put("/** @return {"); this.rec(n.returnType); this.put("} */ ");
    }
    if (n.async) this.put("async ");
    this.put("function ("); this.arr(n.params, ", ", showTypes); this.put(") ");
    this.rec(n.body, null, /* wrapped */ true)
  }
  ArrowFunctionExpression(n, showTypes) {
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
  LogicalExpression(n) {
    this.put("("); this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); this.put(")");
  }
  SequenceExpression(n) { this.arr(n.expressions, ", "); }
  ObjectExpression(n, _, wrapped) {
    if (wrapped) this.put("("); this.put("{");
    this.inc(); this.arrLines(n.properties, ","); this.dec();
    if (n.properties.length) this.ret();
    this.put("}"); if (wrapped) this.put(")");
  }
  Property(n) {
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
  TemplateLiteral(n) {
    this.put("`");
    for (let i = 0; i < n.quasis.length; ++i) {
      this.put(n.quasis[i].value.raw);
      if (i < n.expressions.length) {
        this.put("${"); this.rec(n.expressions[i]); this.put("}");
      }
    }
    this.put("`");
  }
  UnaryExpression(n) { this.put(n.operator); if (n.operator.length > 1) this.put(" "); this.rec(n.argument); }
  UpdateExpression(n) {
    if (n.prefix) this.put(n.operator); this.rec(n.argument); if (!n.prefix) this.put(n.operator);
  }
  NewExpression(n) {
    this.put("new "); this.rec(n.callee);
    this.put("("); this.arr(n.arguments, ", "); this.put(")");
  }
  SpreadElement(n) { this.put("..."); this.rec(n.argument); }
  RestElement(n, showTypes) {
    this.put("..."); this.rec(n.argument);
    if (showTypes == IdentifierTypes.Ts && n.typeAnnotation) {
      this.put(": "); this.rec(n.typeAnnotation);
    }
  }
  ImportExpression(n) { this.put("import("); this.rec(n.source); this.put(")"); }
  AssignmentExpression(n) { this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); }
  ThisExpression(n) { this.put("this"); }
  TaggedTemplateExpression(n) { this.rec(n.tag); this.rec(n.quasi); }
  Super(n) { this.put("super"); }

  // JS Statements
  EmptyStatement(n) { }
  ImportDeclaration(n) {
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
  ImportSpecifier(n) {
    if (n.imported.name != n.local.name) { this.rec(n.imported); this.put(" as "); }
    this.rec(n.local);
  }
  ImportDefaultSpecifier(n) { this.rec(n.local); }
  ExportNamedDeclaration(n) {
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
  ExportSpecifier(n) {
    this.rec(n.local);
    if (n.local.name != n.exported.name) { this.put(" as "); this.rec(n.exported); }
  }
  ExportDefaultDeclaration(n) { this.put("export default "); this.rec(n.declaration); }
  ClassDeclaration(n) {
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
  ClassExpression(n) {
    this.put("("); this.inc(); this.ret();
    this.ClassDeclaration(n);
    this.dec(); this.put(")");
  }
  ClassBody(n) {
    if (this.djs) { this.DJSClassBody(n); return; }
    this.put("{"); this.inc();
    this.arrLines(n.body, "");
    this.dec(); this.ret(); this.put("}");
  }
  MethodDefinition(n) {
    if (n.kind == "constructor") { this.ConstructorDefinition(n); return }
    n.value.modifiers |= n.modifiers | (n.override ? Modifier.Override : 0);
    n.value.typeParameters ||= n.typeParameters;
    this.jsDoc(n.value, n.value.modifiers);
    if (n.static) this.put("static "); if (n.value.async) this.put("async ");
    this.rec(n.key); this.put("("); this.arr(n.value.params, ", "); this.put(") ");
    if (n.value.body) this.rec(n.value.body); else this.put("{}");
  }
  PropertyDefinition(n) {
    this.jsDocType(n, n.modifiers);
    if (n.static) this.put("static "); this.rec(n.key);
    if (n.value) { this.put(" = "); this.rec(n.value); } this.put(";");
  }
  VariableDeclaration(n) {
    n.modifiers |= n.kind == "const" ? Modifier.Readonly : 0;
    if (n.modifiers > Modifier.Readonly) {
      if (n.declarations.length != 1)
        throw "A declaration with jsdoc modifiers must have a single declarator";
      if (n.modifiers & Modifier.Define && !n.declarations[0].id.typeAnnotation)
        throw "A @define variable declaration must have an explicit type annotation";
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
  VariableDeclarator(n, modifiers) {
    if (modifiers != undefined) {
      const isFunctionDecl = n.init && n.init.type.endsWith("FunctionExpression");
      if (isFunctionDecl) this.jsDoc(n.init, modifiers); else this.jsDocType(n.id, modifiers);
      this.put((modifiers & Modifier.Readonly) ? "const " : "let "); this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init, isFunctionDecl ? IdentifierTypes.None : undefined); }
      this.put(";");
    } else {
      this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init); }
    }
  }
  FunctionDeclaration(n) {
    this.jsDoc(n);
    this.put("function "); this.rec(n.id); this.put("("); this.arr(n.params, ", "); this.put(") ");
    this.rec(n.body);
  }
  ArrayPattern(n) { this.put("["); this.arr(n.elements, ", "); this.put("]"); }
  ObjectPattern(n) { this.put("{ "); this.arr(n.properties, ", "); this.put(" }"); }
  AssignmentPattern(n) { this.rec(n.left); this.put(" = "); this.rec(n.right); }
  ContinueStatement(n) { this.put("continue"); if (n.label) { this.put(" "); this.rec(n.label); } this.put(";"); }
  BreakStatement(n) { this.put("break"); if (n.label) { this.put(" "); this.rec(n.label); } this.put(";"); }
  ExpressionStatement(n) {
    const wrap = wrapExpression(n.expression);
    if (wrap) this.put("("); this.rec(n.expression); if (wrap) this.put(")"); this.put(";");
  }
  ThrowStatement(n) { this.put("throw "); this.rec(n.argument); this.put(";"); }
  IfStatement(n) {
    this.put("if ("); this.rec(n.test); this.put(")");
    this.blockLike(n.consequent);
    if (n.alternate) {
      if (n.consequent.type == "BlockStatement") this.put(" "); else this.ret();
      this.put("else"); this.blockLike(n.alternate, true);
    }
  }
  ForStatement(n) {
    this.put("for ("); this.rec(n.init); this.ens(";"); this.put(" ");
    this.rec(n.test); this.put("; "); this.rec(n.update);
    this.put(")");
    this.blockLike(n.body);
  }
  ForOfStatement(n, of = " of ") {
    this.put("for "); if (n.await) this.put("await ");
    this.put("("); this.rec(n.left); this.del(); this.put(of); this.rec(n.right); this.put(")");
    this.blockLike(n.body);
  }
  ForInStatement(n) { this.ForOfStatement(n, " in "); }
  WhileStatement(n) { this.put("while ("); this.rec(n.test); this.put(")"); this.blockLike(n.body); }
  ReturnStatement(n) { this.put("return "); this.rec(n.argument); this.put(";"); }
  SwitchStatement(n) {
    this.put("switch ("); this.rec(n.discriminant); this.put(") {");
    this.inc(); this.arrLines(n.cases, ""); this.dec();
    this.ret(); this.put("}");
  }
  TryStatement(n) {
    this.put("try "); this.rec(n.block);
    if (n.handler) this.rec(n.handler);
    if (n.finalizer) this.rec(n.finalizer);
  }
  CatchClause(n) {
    this.put(" catch ");
    if (n.param) { this.put("("); this.rec(n.param); this.put(") "); }
    this.rec(n.body);
  }
  SwitchCase(n) {
    if (n.test) { this.put("case "); this.rec(n.test); } else this.put("default");
    this.put(":");
    this.inc(); this.arrLines(n.consequent, ""); this.dec();
  }
  BlockStatement(n) {
    this.put("{");
    this.inc(); this.arrLines(n.body, ""); this.dec(); this.ret();
    this.put("}");
  }
  Program(n) { this.arrInner(n.body); this.ret(); }

  // Helpers
  blockLike(n, allowIf) {
    if (n.type == "BlockStatement" || (allowIf && n.type == "IfStatement")) {
      this.put(" "); this.rec(n);
    } else {
      this.inc(); this.ret(); this.rec(n); this.dec();
    }
  }

  // KDJS jsdoc
  jsDocType(n, modifiers) {
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
  jsDoc(n, modifiers) {
    const params = n.params || n.parameters;
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
      let isOptional = param.optional;
      let isRest = false;
      let typeAnnotation = null;
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
        typeAnnotation = unwrapArrayElementType(inner) ?? inner;
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
  DJSInterfaceBody(n) {
    const { instanceProps, other } = partitionBody(n.body);
    this.put("{"); this.inc();
    this.ConstructorDefinition(null, instanceProps);
    this.arrLines(other, "", true);
    this.dec(); this.ret(); this.put("}");
  }
  DJSClassBody(n) {
    const { ctor, instanceProps, other } = partitionBody(n.body);
    this.put("{"); this.inc();
    this.ConstructorDefinition(ctor, instanceProps);
    this.arrLines(other, "");
    this.dec(); this.ret(); this.put("}");
  }
  // Handles classes with explicity constructor, and potentially
  // `TSParameterProperty`'s and `Property`'s.
  // TODO(KimlikDAO-bot): do this properly. we need prop deduping
  ConstructorDefinition(n, props = []) {
    if (!n && !props.length) return;
    if (n) {
      const params = n.value.params;
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
    } else {
      this.ret();
      this.put("constructor() {"); this.inc();
    }
    for (const prop of props) {
      this.ret();
      this.jsDocType(prop, prop.readonly ? Modifier.Readonly : 0);
      this.put("this."); this.rec(prop.key); this.put(";");
    }
    this.dec(); this.ret();
    this.put("}")
  }
}

const generate = (node, options) => {
  const g = new Generator(options);
  g.rec(node);
  return g.out;
}

export { generate };

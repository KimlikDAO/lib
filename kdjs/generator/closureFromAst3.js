import { partition } from "../../util/arrays";

const determineEnumType = () => "string";

const genJsDocType = (d) => d.id.typeAnnotation ||
  d.init && d.init.type.endsWith("FunctionExpression");

class Generator {
  indent = "";
  out = "";

  inc() { this.indent += "  "; }
  dec() { this.indent = this.indent.slice(0, -2); }
  ret(c) { this.out += (c ?? "") + "\n" + this.indent; }
  put(s) { this.out += s; }
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
  arrInner(a, sep, ...rest) {
    let first = true;
    for (const x of a) {
      if (first) first = false; else { this.put(sep); this.ret(); }
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

  // TS Type expressions
  TSArrayType(n) { this.rec(n.elementType); this.put("[]"); }
  TSAsExpression(n) {
    this.put("/** @type {"); this.rec(n.typeAnnotation); this.put("} */(");
    this.rec(n.expression);
    this.put(")");
  }
  TSFunctionType(n) {
    this.put("("); this.arr(n.parameters, ", ", true); this.put(") => "); this.rec(n.typeAnnotation);
  }
  TSLiteralType(n) { this.put(typeof n.literal.value); }
  TSParenthesizedType(n) { this.put("("); this.rec(n.typeAnnotation); this.put(")"); }
  TSTupleType(n) { this.rec(n.elementTypes[0]); this.put("[]"); } // TODO() throw if multiple types
  TSUnionType(n) { this.arr(n.types, " | "); }
  TSPropertySignature(n) {
    this.rec(n.key); if (n.optional) this.put("?"); this.put(": "); this.rec(n.typeAnnotation);
  }
  TSQualifiedName(n) { this.rec(n.left); this.put("." + n.right.name); }
  TSTypeAnnotation(n) { this.rec(n.typeAnnotation); }
  TSTypeLiteral(n) {
    this.put("{");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("}");
  }
  TSTypeOperator(n) { this.put(n.operator + " "); this.rec(n.typeAnnotation); }
  TSTypeParameter(n) { this.put(n.name); }
  TSTypeParameterInstantiation(n) { this.put("<"); this.arr(n.params, ", "); this.put(">"); }
  TSTypeReference(n) { this.rec(n.typeName); this.rec(n.typeArguments); }
  TSExpressionWithTypeArguments(n) { this.rec(n.expression); }

  // TS Declarations
  TSEnumDeclaration(n) {
    const type = determineEnumType(n);
    this.put(`/** @enum {${type}} */`); this.ret();
    this.put("const "); this.rec(n.id); this.put(" = {");
    this.inc(); this.arrLines(n.members, ","); this.dec(); this.ret();
    this.put("}");
  }
  TSEnumMember(n) { this.rec(n.id); this.put(": "); this.rec(n.initializer); }
  TSTypeAliasDeclaration(n) {
    this.ret("/**");
    this.put(" * @typedef {"); this.rec(n.typeAnnotation); this.ret("}");
    this.ret(" */");
    this.put("const "); this.rec(n.id); this.put(" = {}");
  }
  TSInterfaceDeclaration(n) {
    this.ret("/**");
    this.ret(" * @interface");
    if (n.extends && n.extends.length > 1)
      for (const iface of n.extends.slice(1)) {
        this.put(" * @extends {"); this.rec(iface); this.ret("}")
      }
    this.ret(" */");
    this.put("class "); this.rec(n.id);
    if (n.extends) { this.put(" extends "); this.rec(n.extends[0]); }
    this.put(" "); this.rec(n.body);
  }
  TSInterfaceBody(n) {
    this.put("{"); this.inc();
    const [properties, methods] = partition(n.body, (c) => c.type.charCodeAt(2) == 80); // 80 is "P".charCodeAt(0)
    if (properties.length) {
      this.ret();
      this.put("constructor() {"); this.inc();
      for (const property of properties) {
        this.ret();
        this.jsDocType(property);
        this.put("this."); this.rec(property.key); this.put(";");
      }
      this.dec(); this.ret();
      this.put("}")
    }
    this.arrLines(methods, "");
    this.dec(); this.ret(); this.put("}");
  }
  TSMethodSignature(n) {
    this.jsDoc(n)
    this.rec(n.key); this.put("("); this.arr(n.parameters, ", "); this.put(") {}");
  }
  TSParameterProperty(n) { this.rec(n.parameter); }

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
  BinaryExpression(n) {
    this.put("("); this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); this.put(")");
  }
  CallExpression(n) { this.rec(n.callee); this.put("("); this.arr(n.arguments, ", "); this.put(")"); }
  ConditionalExpression(n) {
    this.put("("); this.rec(n.test); this.put(" ? ");
    this.rec(n.consequent); this.put(" : "); this.rec(n.alternate); this.put(")");
  }
  MemberExpression(n) {
    this.rec(n.object);
    if (n.computed) {
      this.put("["); this.rec(n.property); this.put("]");
    } else {
      this.put("."); this.rec(n.property);
    }
  }
  Identifier(n, showType) {
    this.put(n.name); if (showType && n.typeAnnotation) { this.put(": "); this.rec(n.typeAnnotation); }
  }
  ArrowFunctionExpression(n) {
    if (n.async) this.put("async ");
    this.put("("); this.arr(n.params, ", "); this.put(") => "); this.rec(n.body);
  }
  LogicalExpression(n) { this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); }
  SequenceExpression(n) { this.arr(n.expressions, ", "); }
  ObjectExpression(n) {
    this.put("{");
    this.inc(); this.arrLines(n.properties, ","); this.dec(); this.ret();
    this.put("}");
  }
  Property(n) { this.rec(n.key); this.put(": "); this.rec(n.value); }
  UpdateExpression(n) {
    if (n.prefix) this.put(n.operator); this.rec(n.argument); if (!n.prefix) this.put(n.operator);
  }
  NewExpression(n) {
    this.put("new "); this.rec(n.callee);
    this.put("("); this.arr(n.arguments, ", "); this.put(")");
  }
  AssignmentExpression(n) { this.rec(n.left); this.put(` ${n.operator} `); this.rec(n.right); }
  ThisExpression(n) { this.put("this"); }

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
    this.put(" from "); this.rec(n.source);
  }
  ImportSpecifier(n) {
    if (n.imported.name != n.local.name) { this.rec(n.imported); this.put(" as "); }
    this.rec(n.local);
  }
  ImportDefaultSpecifier(n) { this.rec(n.local); }
  ExportNamedDeclaration(n) {
    this.ret();
    if (n.specifiers.length < 3) {
      this.put("export { "); this.arr(n.specifiers, ", "); this.put(" }");
    } else {
      this.put("export {");
      this.inc(); this.arrLines(n.specifiers, ","); this.dec(); this.ret();
      this.put("}");
    }
  }
  ExportSpecifier(n) {
    this.rec(n.local);
    if (n.local.name != n.exported.name) { this.put(" as "); this.rec(n.exported); }
  }
  ClassDeclaration(n) {
    if (n.implements) {
      this.ret("/**");
      for (const iface of n.implements) {
        this.put(" * @implements {"); this.rec(iface); this.ret("}");
      }
      this.ret(" */");
    }
    this.put("class "); this.rec(n.id);
    if (n.superClass) { this.put(" extends "); this.rec(n.superClass); }
    this.put(" "); this.rec(n.body);
  }
  ClassBody(n) {
    this.put("{");
    this.inc(); this.arrLines(n.body, ""); this.dec(); this.ret();
    this.put("}");
  }
  MethodDefinition(n) {
    this.jsDoc(n.value);
    if (n.static) this.put("static "); if (n.value.async) this.put("async ");
    this.rec(n.key); this.put("("); this.arr(n.value.params, ", "); this.put(") ");
    if (n.kind == "constructor")
      this.constructorBody(n.value.params, n.value.body);
    else
      this.rec(n.value.body);
  }
  VariableDeclaration(n) {
    const [typed, untyped] = partition(n.declarations, genJsDocType);
    this.arrInner(typed, ";", n.kind);
    if (untyped.length) {
      this.put(n.kind + " "); this.arr(untyped, ", ");
    }
  }
  VariableDeclarator(n, kind) {
    if (kind) {
      if (n.init.type.endsWith("FunctionExpression")) this.jsDoc(n.init);
      else this.jsDocType(n.id, kind);
      this.put(kind + " "); this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init); }
    } else {
      this.rec(n.id);
      if (n.init) { this.put(" = "); this.rec(n.init); }
    }
  }
  ArrayPattern(n) { this.put("["); this.arr(n.elements, ", "); this.put("]"); }
  ExpressionStatement(n) { this.rec(n.expression); }
  ThrowStatement(n) { this.put("throw "); this.rec(n.argument); }
  IfStatement(n) {
    this.put("if ("); this.rec(n.test); this.put(")");
    this.blockLike(n.consequent);
    if (n.alternate) {
      this.ret(";"); this.put("else");
      this.blockLike(n.alternate, true);
    }
  }
  ForStatement(n) {
    this.put("for (");
    this.rec(n.init); this.put("; "); this.rec(n.test); this.put("; "); this.rec(n.update);
    this.put(")");
    this.blockLike(n.body);
  }
  ForOfStatement(n, of = " of ") {
    this.put("for ("); this.rec(n.left); this.put(of); this.rec(n.right); this.put(")");
    this.blockLike(n.body);
  }
  ForInStatement(n) { this.ForOfStatement(n, " in "); }
  ReturnStatement(n) { this.put("return "); this.rec(n.argument); }
  BlockStatement(n) {
    this.put("{");
    this.inc(); this.arrLines(n.body, ";"); this.put(";"); this.dec(); this.ret();
    this.put("}");
  }
  Program(n) { this.arrInner(n.body, ";"); this.ret(";"); }

  // KDJS jsdoc
  jsDocType(n, kind) {
    const tag = kind == "const" ? kind : "type";
    this.put(`/** @${tag} {`); this.rec(n.typeAnnotation); this.put("} */"); this.ret();
  }
  jsDoc(n) {
    const params = n.params || n.parameters;
    const retType = n.returnType || n.typeAnnotation || { type: "TSVoidKeyword" };
    this.put("/**");
    if (n.typeParameters)
      for (const param of n.typeParameters.params) {
        this.ret();
        this.put(" * @template "); this.rec(param);
      }
    for (const param of params) {
      const typeAnnotation = param.typeAnnotation || param.parameter.typeAnnotation;
      this.ret();
      this.put(" * @param {"); this.rec(typeAnnotation);
      if (param.optional) this.put("="); this.put("} "); this.rec(param);
    }
    this.ret();
    this.put(" * @return {"); this.rec(retType); this.put("}"); this.ret();
    this.ret(" */");
  }
  constructorBody(params, body) {
    this.put("{"); this.inc();
    for (const param of params)
      if (param.type.charCodeAt(0) == 84) {
        this.ret();
        this.jsDocType(param.parameter, param.readonly ? "const" : "");
        this.put("this."); this.rec(param.parameter); this.put(" = "); this.rec(param.parameter); this.put(";");
      }
    this.dec(); this.ret(); this.put("}")
  }
  blockLike(n, allowIf) {
    if (n.type == "BlockStatement" || (allowIf && n.type == "IfStatement")) {
      this.put(" "); this.rec(n);
    } else {
      this.inc(); this.ret(); this.rec(n); this.dec();
    }
  }
}

const generate = (node) => {
  const g = new Generator();
  g.rec(node);
  return g.out;
}

export { generate };

/**
 * @fileoverview Minimal TS→kdjs-js transpiler: top-level const enum, variable, and export.
 * Parse with acorn-typescript, walk program body, emit const enum, VariableDeclaration, export.
 */
import { Parser } from "acorn";
import { generate } from "astring";
import { tsPlugin } from "../parser/acorn-typescript";

const TsParser = Parser.extend(tsPlugin());

const parseOptions = {
  sourceType: "module",
  ecmaVersion: "latest",
  locations: true,
};

/** @param {acorn.TSEnumDeclaration} node */
const emitConstEnum = (node) => {
  const name = node.id.name;
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
  return "/** @enum {" + enumType + "} */\nconst " + name + " = {\n" + entries + "\n};";
};

/**
 * Minimal type annotation → JSDoc type string (no imports resolution).
 * @param {acorn.Node} typeNode
 * @returns {string}
 */
const typeToJSDocString = (typeNode) => {
  if (!typeNode) return "";
  switch (typeNode.type) {
    case "TSArrayType":
      return typeToJSDocString(typeNode.elementType) + "[]";
    case "TSTypeReference": {
      const tn = typeNode.typeName;
      const base =
        tn.type == "TSQualifiedName"
          ? typeToJSDocString(tn.left) + "." + (tn.right?.name ?? "")
          : (tn.name ?? "");
      if (typeNode.typeParameters?.params?.length)
        return base + "<" + typeNode.typeParameters.params.map(typeToJSDocString).join(", ") + ">";
      return base;
    }
    case "TSTypeOperator":
      return typeToJSDocString(typeNode.typeAnnotation);
    default:
      return (typeNode.name ?? typeNode.type ?? "?");
  }
};

/** @param {acorn.VariableDeclaration} node */
const emitVariableDeclaration = (node) => {
  if (node.kind != "const") return [];
  const out = [];
  for (const decl of node.declarations) {
    const name = decl.id.type == "Identifier" ? decl.id.name : null;
    if (name == null || decl.init == null) continue;
    const typeNode = decl.id.typeAnnotation?.typeAnnotation;
    const typeStr = typeNode ? typeToJSDocString(typeNode) : "";
    const line = "const " + name + " = " + generate(decl.init) + ";";
    out.push(typeStr ? "/** @const {" + typeStr + "} */\n" + line : line);
  }
  return out;
};

/** @param {acorn.ExportNamedDeclaration} node */
const emitExport = (node) => {
  if (!node.specifiers || node.specifiers.length == 0) return "";
  const entries = node.specifiers.map((s) => "  " + s.exported.name).join(",\n");
  return "export {\n" + entries + "\n};";
};

/**
 * @param {string} content TypeScript source. Must parse (e.g. const enums already replaced by bindings if needed).
 * @returns {string} kdjs-js: /** @enum *\/ const Name = { ... }; export { ... };
 */
const transpileTs = (content) => {
  const ast = TsParser.parse(content, parseOptions);
  const lines = [];
  for (const node of ast.body) {
    if (node.type == "TSEnumDeclaration") {
      if (!node.const) throw "Only const enum is allowed, not enum. Use const enum.";
      lines.push(emitConstEnum(node));
    } else if (node.type == "VariableDeclaration") {
      for (const line of emitVariableDeclaration(node)) lines.push(line);
    } else if (node.type == "ExportNamedDeclaration") {
      const out = emitExport(node);
      if (out) lines.push(out);
    }
  }
  return (lines.join("\n\n") || "").replace(/$/, "\n");
};

export { transpileTs };

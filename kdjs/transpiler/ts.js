/**
 * @fileoverview Minimal TS→kdjs-js transpiler: top-level const enum, variable, and export.
 * Parse with acorn-typescript, walk program body, emit const enum, VariableDeclaration, export.
 */
import { TsParser } from "../parser/tsParser";
import {
  generate,
  generateEnum,
  generateExport,
  generateTypeExpr,
} from "./generator";

/** @param {acorn.VariableDeclaration} node */
const generateVariableDeclaration = (node) => {
  if (node.kind != "const") return [];
  const out = [];
  for (const decl of node.declarations) {
    const name = decl.id.type == "Identifier" ? decl.id.name : null;
    if (name == null || decl.init == null) continue;
    const typeNode = decl.id.typeAnnotation?.typeAnnotation;
    const typeStr = typeNode ? generateTypeExpr(typeNode) : "";
    const line = "const " + name + " = " + generate(decl.init) + ";";
    out.push(typeStr ? "/** @const {" + typeStr + "} */\n" + line : line);
  }
  return out + "\n";
};

/**
 * @param {string} content TypeScript source. Must parse (e.g. const enums already replaced by bindings if needed).
 * @returns {string} kdjs-js: /** @enum *\/ const Name = { ... }; export { ... };
 */
const transpileTs = (content) => {
  const ast = TsParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });
  let out = "";
  for (const node of ast.body) {
    if (node.type == "TSEnumDeclaration") {
      if (!node.const) throw "Only const enum is allowed";
      out += generateEnum(node);
    } else if (node.type == "VariableDeclaration")
      out += generateVariableDeclaration(node);
    else if (node.type == "ExportNamedDeclaration")
      out += "\n" + generateExport(node);
  }
  return out;
};

export { transpileTs };

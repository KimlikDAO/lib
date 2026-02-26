/**
 * @fileoverview Minimal TS→kdjs-js transpiler: top-level const enum, variable, and export.
 * Parse with acorn-typescript, walk program body, emit const enum, VariableDeclaration, export.
 */
import {
  generate,
  generateClassInterface,
  generateEnum,
  generateExport,
  generateImport,
  generateTypedef,
  generateTypeExpr,
} from "../generator/closureFromAst";
import { TsParser } from "../parser/tsParser";
import { FunctionType } from "../types/types";

/** @param {acorn.VariableDeclaration} node */
const generateVariableDeclaration = (node) => {
  const out = [];
  const kind = node.kind;
  const tag = kind == "const" ? "const" : "type";
  for (const decl of node.declarations) {
    const name = decl.id.type == "Identifier" ? decl.id.name : null;
    if (name == null || decl.init == null) continue;
    const init = decl.init;
    const isFunctionInit = init.type == "ArrowFunctionExpression" || init.type == "FunctionExpression";
    const typeExpression = isFunctionInit && init.typeExpression
      ? init.typeExpression
      : decl.id.typeExpression;
    let block = "";
    if (isFunctionInit && typeExpression instanceof FunctionType && typeExpression.toTsDoc) {
      block = typeExpression.toTsDoc();
    } else if (typeExpression && typeExpression.toTsExpr) {
      const typeStr = typeExpression.toTsExpr();
      block = "/** @" + tag + " {" + typeStr + "} */";
    } else {
      const typeNode = decl.id.typeAnnotation?.typeAnnotation;
      const typeStr = typeNode ? generateTypeExpr(typeNode) : "";
      block = typeStr ? "/** @" + tag + " {" + typeStr + "} */" : "";
    }
    const line = kind + " " + name + " = " + generate(init) + ";";
    out.push(block ? block + "\n" + line : line);
  }
  return out.join("\n") + "\n";
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
    if (node.type == "ImportDeclaration")
      out += generateImport(node);
    else if (node.type == "TSEnumDeclaration") {
      if (!node.const) throw "Only const enum is allowed";
      out += generateEnum(node);
    } else if (node.type == "TSTypeAliasDeclaration")
      out += "\n" + generateTypedef(node);
    else if (node.type == "TSInterfaceDeclaration")
      out += generateClassInterface(node);
    else if (node.type == "VariableDeclaration")
      out += generateVariableDeclaration(node);
    else if (node.type == "ExportNamedDeclaration")
      out += "\n" + generateExport(node);
  }
  return out;
};

export { transpileTs };

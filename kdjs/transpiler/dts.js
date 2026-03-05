/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js) using Acorn.
 * 
 * @author KimlikDAO
 */
import { combine, getDir } from "../../util/paths";
import { generate } from "../generator/kdjsFromAst";
import { TsParser } from "../parser/tsParser";
import { resolveExtension } from "../util/resolver";

/**
 * Converts a file path to a namespace name.
 *
 * @param {string} filePath The file path
 * @return {string} The namespace name
 */
const pathToNamespace = (filePath) => {
  if (filePath.endsWith(".ts") || filePath.endsWith(".js"))
    filePath = filePath.slice(0, -3);
  return "kdjs$$" + filePath.slice(0, -2).replaceAll("/", "$");
}

const EmittedNodes = {
  ClassDeclaration: true,
  TSInterfaceDeclaration: true,
  TSTypeAliasDeclaration: true,
  TSEnumDeclaration: true,
};

/**
 * This type map will baked into the Literal nodes by {@link TsParser} in the
 * future.
 *
 * Collects type information from the AST, including imports and local definitions.
 *
 * @param {acorn.Program} ast The AST to process
 * @param {string} importer The path of the importing file
 * @return {Map<string, string>} Map of type names to namespaces
 */
const collectTypes = (ast, importer) => {
  const typeMap = new Map();
  const importerPath = getDir(importer);
  const currentNamespace = pathToNamespace(importer);

  for (const node of ast.body)
    if (EmittedNodes[node.type]) {
      typeMap.set(node.id.name, `${currentNamespace}$${node.id.name}`);
    } else if (node.type == "ImportDeclaration") {
      const source = node.source.value;
      let sourcePath =
        source.startsWith("/") ? source.slice(1) : combine(importerPath, source);
      if (sourcePath.endsWith(".d"))
        sourcePath = resolveExtension(sourcePath);
      if (sourcePath.endsWith("d.ts")) {
        const importNamespace = pathToNamespace(sourcePath);
        for (const specifier of node.specifiers)
          if (specifier.type == "ImportDefaultSpecifier")
            // Default import: import name from "./path"
            typeMap.set(specifier.local.name, importNamespace);
          else if (specifier.type == "ImportSpecifier")
            // Named import: import { name } from "./path"
            typeMap.set(specifier.local.name, `${importNamespace}$${specifier.imported.name}`);
      }
    }
  return typeMap;
};

/**
 * Transpiles TypeScript declaration content to Google Closure Compiler format.
 *
 * @param {string} content The TypeScript declaration content
 * @param {string} sourcePath The source path of the TypeScript declaration file
 * @return {string} The transpiled content
 */
const transpileDts = (content, sourcePath) => {
  const ast = TsParser.parse(content);
  const typeMap = collectTypes(ast, sourcePath);
  const namespace = pathToNamespace(sourcePath);

  let output = "/** @externs */\n";
  for (const node of ast.body)
    if (node.type == "ImportDeclaration")
      output += `import "${node.source.value}"; // kdjs-djs: imports are for dependency crawling\n`; 

  for (const node of ast.body)
    if (EmittedNodes[node.type])
      output += generate(node, typeMap) + ";\n";
  return output;
};

/**
 * @param {string} content
 * @return {string}
 */
const generatePlaceholder = (content) => {
  const ast = TsParser.parse(content);
  const namedExports = new Set();
  let defaultExport = null;

  for (const node of ast.body) {
    if (node.type == "ExportNamedDeclaration") {
      if (node.specifiers)
        for (const s of node.specifiers)
          namedExports.add(s.exported.name);
      if (node.declaration?.id?.name)
        namedExports.add(node.declaration.id.name);
    } else if (node.type == "ExportDefaultDeclaration") {
      const d = node.declaration;
      if (d.type == "ObjectExpression")
        defaultExport = Object.fromEntries(
          (d.properties || []).map(p => [p.key?.name, true]).filter(([k]) => k)
        );
      else if (d.name)
        defaultExport = { [d.name]: true };
      else
        defaultExport = {};
    } else if (node.type == "TSInterfaceDeclaration" || node.type == "TSTypeAliasDeclaration")
      namedExports.add(node.id.name);
  }

  let code = Array.from(namedExports)
    .map(name => `export const ${name} = {};`)
    .join("\n");
  if (defaultExport) {
    const keys = Object.keys(defaultExport);
    code += keys.length ? `\nexport default { ${keys.join(", ")} };` : "\nexport default {};";
  }
  return code;
};

export {
  generatePlaceholder,
  pathToNamespace,
  transpileDts
};

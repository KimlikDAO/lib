/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js) using Acorn.
 * 
 * @author KimlikDAO
 */
import { combine, getDir } from "../../util/paths";
import {
  generateClassInterface,
  generateEnum,
  generateTypedef
} from "../generator/closureFromAst";
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
  return "namespace$$" + filePath.slice(0, -2).replaceAll("/", "$");
}

/**
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
    if (
      node.type === "TSInterfaceDeclaration" ||
      node.type === "TSTypeAliasDeclaration" ||
      node.type === "TSEnumDeclaration"
    ) {
      typeMap.set(node.id.name, `${currentNamespace}.${node.id.name}`);
    } else if (node.type === "ImportDeclaration") {
      const source = node.source.value;
      let sourcePath =
        source.startsWith("/") ? source.slice(1) : combine(importerPath, source);
      if (sourcePath.endsWith(".d"))
        sourcePath = resolveExtension(sourcePath);
      if (sourcePath.endsWith("d.ts")) {
        const importNamespace = pathToNamespace(sourcePath);
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportDefaultSpecifier") {
            // Default import: import name from "./path"
            typeMap.set(specifier.local.name, importNamespace);
          } else if (specifier.type === "ImportSpecifier") {
            // Named import: import { name } from "./path"
            typeMap.set(
              specifier.local.name,
              `${importNamespace}.${specifier.imported.name}`
            );
          }
        }
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
const transpileDeclaration = (content, sourcePath) => {
  const ast = TsParser.parse(content);
  const namespace = pathToNamespace(sourcePath);
  const typeMap = collectTypes(ast, sourcePath);

  let output = "/** @externs */\n";
  for (const node of ast.body)
    if (node.type === "ImportDeclaration")
      output += `import "${node.source.value}";\n`; // add for dependency crawling

  output += `/** @const */\nconst ${namespace} = {};\n\n`;
  for (const node of ast.body) {
    if (node.type == "TSInterfaceDeclaration") {
      output += generateClassInterface(node, typeMap);
    } else if (node.type == "TSTypeAliasDeclaration") {
      output += generateTypedef(node, typeMap);
    } else if (node.type == "TSEnumDeclaration") {
      output += generateEnum(node, typeMap);
    }
  }
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

  // Walk the AST to find exports and declarations
  for (const node of ast.body) {
    if (node.type === "ExportNamedDeclaration") {
      // Handle export { x, y }
      if (node.specifiers) {
        for (const specifier of node.specifiers)
          namedExports.add(specifier.exported.name);
      }

      // Handle export interface/type/class directly
      if (node.declaration) {
        if (node.declaration.id) {
          namedExports.add(node.declaration.id.name);
        }
      }
    }

    // Handle export default
    else if (node.type === "ExportDefaultDeclaration") {
      if (node.declaration.type === "ObjectExpression") {
        defaultExport = {};
        for (const prop of node.declaration.properties) {
          if (prop.key && prop.key.name) {
            defaultExport[prop.key.name] = true;
          }
        }
      } else if (node.declaration.name) {
        defaultExport = { [node.declaration.name]: true };
      } else {
        defaultExport = {};
      }
    }

    // Collect interface declarations (they might be exported later)
    else if (node.type === "TSInterfaceDeclaration")
      namedExports.add(node.id.name);
    // Collect type aliases (they might be exported later)
    else if (node.type === "TSTypeAliasDeclaration")
      namedExports.add(node.id.name);
  }

  let code = Array.from(namedExports)
    .map(name => `export const ${name} = {};`)
    .join("\n");

  if (defaultExport) {
    const defaultExportProps = Object.keys(defaultExport);
    if (defaultExportProps.length > 0)
      code += `\nexport default { ${defaultExportProps.join(", ")} };`;
    else
      code += "\nexport default {};";
  }
  return code;
}

export {
  generatePlaceholder,
  pathToNamespace,
  transpileDeclaration
};

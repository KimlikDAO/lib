/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js) using Acorn.
 * 
 * @author KimlikDAO
 */
import { combine, getDir } from "../../util/paths";
import { TsParser } from "../parser/tsParser";
import { resolveExtension } from "../util/resolver";
import {
  generateEnum,
  generateTypeExpr,
  generateTypedef
} from "./generator";

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
  const ast = TsParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });
  const namespace = pathToNamespace(sourcePath);
  const typeMap = collectTypes(ast, sourcePath);

  let output = "/** @externs */\n";
  for (const node of ast.body)
    if (node.type === "ImportDeclaration")
      output += `import "${node.source.value}";\n`; // add for dependency crawling

  output += `/** @const */\nconst ${namespace} = {};\n\n`;
  for (const node of ast.body) {
    if (node.type == "TSInterfaceDeclaration") {
      output += generatePrototypeInterface(node, namespace, typeMap);
    } else if (node.type == "TSTypeAliasDeclaration") {
      output += generateTypedef(node, namespace, typeMap);
    } else if (node.type == "TSEnumDeclaration") {
      output += generateEnum(node, namespace);
    }
  }
  return output;
};

/**
 * Serializes a TypeScript interface into a GCC interface definition.
 *
 * @param {acorn.TSInterfaceDeclaration} node The interface declaration node
 * @param {string} namespace The namespace name
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The transpiled interface content
 */
const generatePrototypeInterface = (node, namespace, typeMap) => {
  const scopedName = `${namespace}.${node.id.name}`;

  let output = "";
  output += `/**\n`;
  output += ` * @struct\n`;
  output += ` * @interface\n`;
  if (node.extends && node.extends.length > 0) {
    for (const extendedInterface of node.extends) {
      const extendsName = generateTypeExpr(extendedInterface.expression, typeMap);
      output += ` * @extends {${extendsName}}\n`;
    }
  }
  output += ` */\n`;
  output += `${scopedName} = function () {};\n\n`;

  if (!node.body || !node.body.body)
    return output;
  for (const member of node.body.body)
    if (member.type == "TSPropertySignature")
      output += generateProperty(member, scopedName, typeMap);
    else if (member.type == "TSMethodSignature")
      output += generateMethod(member, scopedName, typeMap);
  return output;
};

/**
 * @param {acorn.TSPropertySignature} node The property signature node
 * @param {string} interfaceName The full interface name
 * @param {Map<string, string>} typeMap Map of type names to namespaces
 * @return {string} The transpiled property content
 */
const generateProperty = (node, interfaceName, typeMap) => {
  const propertyName = node.key.name || node.key.value;
  const typeText = generateTypeExpr(
    node.typeAnnotation && node.typeAnnotation.typeAnnotation,
    typeMap
  );
  let output = "";
  const finalType = typeText + (node.optional ? " | undefined" : "");
  const annotation = node.readonly ? "const" : "type";
  output += `/** @${annotation} {${finalType}} */\n`;
  output += `${interfaceName}.prototype.${propertyName};\n\n`;
  return output;
};

/**
 * @param {acorn.TSMethodSignature} node The method signature node
 * @param {string} interfaceName The full interface name
 * @param {Map<string, string>} typeMap Map of type names to namespaces
 * @return {string} The transpiled method content
 */
const generateMethod = (node, interfaceName, typeMap) => {
  const methodName = node.key.name || node.key.value;

  // Process parameters
  const params = node.parameters || [];
  const paramDocs = params.map(param => getNameType(param, typeMap));
  const returnType = generateTypeExpr(node.typeAnnotation?.typeAnnotation, typeMap);

  let output = "";
  output += `/**\n`;
  for (const paramDoc of paramDocs)
    output += ` * @param {${paramDoc.type}} ${paramDoc.name}\n`;
  output += ` * @return {${returnType}}\n`;
  output += ` */\n`;
  output += `${interfaceName}.prototype.${methodName} = function (`;
  const paramNames = params.map(p => p.name ? p.name.name || p.name : "");
  output += paramNames.join(", ");
  output += ") {};\n\n";
  return output;
};

/**
 * Processes a parameter node.
 *
 * @param {acorn.TSParameterDeclaration} param The parameter node
 * @param {Map<string, string>} typeMap Map of type names to namespaces
 * @return {{ name: string, type: string }} The parameter name and type
 */
const getNameType = (param, typeMap) => {
  // Extract parameter name correctly based on node structure
  const name = param.name ? param.name.name || param.name : "";
  let type = "*";
  if (param.typeAnnotation)
    type = generateTypeExpr(param.typeAnnotation.typeAnnotation, typeMap);
  // Handle optional parameters
  if (param.optional)
    type += "=";
  return { name, type };
};

/**
 * @param {string} content
 * @return {string}
 */
const generatePlaceholder = (content) => {
  const ast = TsParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });

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

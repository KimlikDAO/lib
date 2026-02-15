/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js) using Acorn.
 * 
 * @author KimlikDAO
 */
import { Parser } from "acorn";
import tsPlugin from "acorn-typescript";
import { combine, getDir } from "../../util/paths";
import { resolveExtension } from "../util/resolver";

const TsParser = Parser.extend(tsPlugin());

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
 * @return {Map<string, string>} Updated map of type names to fully qualified names
 */
const collectTypes = (ast, importer) => {
  const typeMap = new Map();
  const importerPath = getDir(importer);
  const currentNamespace = pathToNamespace(importer);

  for (const node of ast.body) {
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
const transpile = (content, sourcePath) => {
  const ast = TsParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });

  // Generate namespace name from file path
  const namespace = pathToNamespace(sourcePath);

  // Collect all types (local and imported)
  const typeMap = collectTypes(ast, sourcePath);

  // Generate output
  let output = "/** @externs */\n";

  for (const node of ast.body)
    if (node.type === "ImportDeclaration")
      output += `import "${node.source.value}";\n`;

  output += `/** @const */\nconst ${namespace} = {};\n\n`;

  // Process all declarations in the file
  for (const node of ast.body) {
    if (node.type === "TSInterfaceDeclaration") {
      output += processInterface(node, namespace, "", typeMap);
    } else if (node.type === "TSTypeAliasDeclaration") {
      output += processTypeAlias(node, namespace, "", typeMap);
    } else if (node.type === "TSEnumDeclaration") {
      output += processEnum(node, namespace, "");
    }
  }

  return output;
};

/**
 * Processes an interface declaration.
 *
 * @param {acorn.TSInterfaceDeclaration} node The interface declaration node
 * @param {string} namespace The namespace name
 * @param {string} indent The current indentation
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The transpiled interface content
 */
const processInterface = (node, namespace, indent, imports) => {
  const interfaceName = node.id.name;
  const fullName = `${namespace}.${interfaceName}`;

  let output = "";

  // Interface declaration
  output += `${indent}/**\n`;
  output += `${indent} * @struct\n`;
  output += `${indent} * @interface\n`;

  // Process extends clauses if they exist
  if (node.extends && node.extends.length > 0) {
    for (const extendedInterface of node.extends) {
      const extendedName = getExtendedInterfaceName(extendedInterface, imports);
      output += `${indent} * @extends {${extendedName}}\n`;
    }
  }

  output += `${indent} */\n`;
  output += `${indent}${fullName} = function() {};\n\n`;

  // Process interface members
  if (node.body && node.body.body) {
    for (const member of node.body.body) {
      if (member.type === "TSPropertySignature") {
        output += processProperty(member, fullName, indent, imports);
      } else if (member.type === "TSMethodSignature") {
        output += processMethod(member, fullName, indent, imports);
      }
    }
  }

  return output;
};

/**
 * Gets the full name of an extended interface.
 *
 * @param {acorn.TSExpressionWithTypeArguments} extendedInterface The extended interface node
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The full name of the extended interface
 */
const getExtendedInterfaceName = (extendedInterface, imports) => {
  if (extendedInterface.expression.type === "TSQualifiedName") {
    return getQualifiedName(extendedInterface.expression, imports);
  } else {
    const name = extendedInterface.expression.name;
    return resolveTypeName(name, imports);
  }
};

/**
 * Gets the full name of a qualified name node.
 *
 * @param {acorn.TSQualifiedName} qualifiedName The qualified name node
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The full qualified name
 */
const getQualifiedName = (qualifiedName, imports) => {
  if (qualifiedName.left.type === "TSQualifiedName") {
    return `${getQualifiedName(qualifiedName.left, imports)}.${qualifiedName.right.name}`;
  }

  const leftName = qualifiedName.left.name;
  const resolvedLeft = imports.has(leftName) ? imports.get(leftName) : leftName;

  return `${resolvedLeft}.${qualifiedName.right.name}`;
};

/**
 * Resolves a type name to its fully qualified name.
 *
 * @param {string} typeName The type name to resolve
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The fully qualified type name
 */
const resolveTypeName = (typeName, imports) => {
  // If it's an imported name, resolve it
  if (imports.has(typeName)) {
    return imports.get(typeName);
  }

  // If it contains a dot, it's already qualified
  if (typeName.includes('.')) {
    return typeName;
  }

  // Otherwise, it's a local type or a global type
  return typeName;
};

/**
 * Processes a property signature.
 *
 * @param {acorn.TSPropertySignature} node The property signature node
 * @param {string} interfaceName The full interface name
 * @param {string} indent The current indentation
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The transpiled property content
 */
const processProperty = (node, interfaceName, indent, imports) => {
  const propertyName = node.key.name || node.key.value;
  const typeText = getTypeText(
    node.typeAnnotation && node.typeAnnotation.typeAnnotation,
    imports
  );
  const finalType = typeText + (node.optional ? " | undefined" : "");

  let output = "";

  // Check if property has readonly modifier
  const isReadonly = node.readonly;

  const annotation = isReadonly ? "const" : "type";
  output += `${indent}/** @${annotation} {${finalType}} */\n`;
  output += `${indent}${interfaceName}.prototype.${propertyName};\n\n`;

  return output;
};

/**
 * Processes a method signature.
 *
 * @param {acorn.TSMethodSignature} node The method signature node
 * @param {string} interfaceName The full interface name
 * @param {string} indent The current indentation
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The transpiled method content
 */
const processMethod = (node, interfaceName, indent, imports) => {
  const methodName = node.key.name || node.key.value;

  // Process parameters
  const params = node.parameters || [];
  const paramDocs = params.map(param => processParameter(param, imports));

  // Process return type
  const returnType = node.typeAnnotation ?
    getTypeText(node.typeAnnotation.typeAnnotation, imports) :
    "*";

  let output = "";

  // Generate JSDoc for the method
  output += `${indent}/**\n`;

  // Add parameter documentation
  for (const paramDoc of paramDocs)
    output += `${indent} * @param {${paramDoc.type}} ${paramDoc.name}\n`;

  // Add return type documentation
  output += `${indent} * @return {${returnType}}\n`;
  output += `${indent} */\n`;

  // Generate method declaration
  output += `${indent}${interfaceName}.prototype.${methodName} = function(`;

  // Extract parameter names correctly
  const paramNames = params.map(p => {
    if (p.name) {
      return p.name.name || p.name;
    }
    return "";
  });

  output += paramNames.join(", ");
  output += ") {};\n\n";

  return output;
};

/**
 * Processes a parameter node.
 *
 * @param {acorn.TSParameterDeclaration} param The parameter node
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {{name: string, type: string}} The parameter name and type
 */
const processParameter = (param, imports) => {
  // Extract parameter name correctly based on node structure
  const name = param.name ? param.name.name || param.name : "";
  let type = "*";
  if (param.typeAnnotation)
    type = getTypeText(param.typeAnnotation.typeAnnotation, imports);
  // Handle optional parameters
  if (param.optional)
    type += "=";
  return { name, type };
};

/**
 * Processes a type alias declaration.
 *
 * @param {acorn.TSTypeAliasDeclaration} node The type alias declaration node
 * @param {string} namespace The namespace name
 * @param {string} indent The current indentation
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @return {string} The transpiled type alias content
 */
const processTypeAlias = (node, namespace, indent, imports) => {
  const typeName = node.id.name;
  const fullName = `${namespace}.${typeName}`;
  const typeText = getTypeText(node.typeAnnotation, imports);

  let output = "";
  output += `${indent}/** @typedef {${typeText}} */\n`;
  output += `${indent}${fullName};\n\n`;

  return output;
};

/**
 * Processes an enum declaration.
 *
 * @param {acorn.TSEnumDeclaration} node The enum declaration node
 * @param {string} namespace The namespace name
 * @param {string} indent The current indentation
 * @return {string} The transpiled enum content
 */
const processEnum = (node, namespace, indent) => {
  const enumName = node.id.name;
  const fullName = `${namespace}.${enumName}`;

  let output = "";
  output += `${indent}/** @enum {number} */\n`;
  output += `${indent}${fullName} = {\n`;

  // Process enum members
  if (node.members && node.members.length > 0) {
    for (let i = 0; i < node.members.length; i++) {
      const member = node.members[i];
      const memberName = member.id.name;
      const value = member.initializer ?
        (member.initializer.value !== undefined ? member.initializer.value : member.initializer.name) :
        i;

      output += `${indent}  ${memberName}: ${value}`;
      if (i < node.members.length - 1) {
        output += ",";
      }
      output += "\n";
    }
  }

  output += `${indent}};\n\n`;

  return output;
};

/**
 * Gets the text representation of a type node.
 *
 * @param {acorn.TSType} typeNode The type node
 * @param {Map<string, string>} imports Map of imported names to namespaces
 * @param {boolean=} topLevel Whether this is a top-level type
 * @return {string} The text representation of the type
 */
const getTypeText = (typeNode, imports, topLevel = true) => {
  if (!typeNode) return "*";

  switch (typeNode.type) {
    case "TSStringKeyword":
      return "string";
    case "TSNumberKeyword":
      return "number";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSAnyKeyword":
      return "?"; // TypeScript 'any' maps to GCC '?'
    case "TSUnknownKeyword":
      return "*"; // TypeScript 'unknown' maps to GCC '*'
    case "TSVoidKeyword":
      return "void";
    case "TSNullKeyword":
      return "null";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSObjectKeyword":
      return "Object";
    case "TSArrayType":
      return `!Array<${getTypeText(typeNode.elementType, imports)}>`;
    case "TSTypeReference": {
      // Handle type references (e.g., interfaces, type aliases)
      let baseType;
      if (typeNode.typeName.type === "TSQualifiedName") {
        baseType = getQualifiedName(typeNode.typeName, imports);
      } else {
        baseType = resolveTypeName(typeNode.typeName.name, imports);
      }

      // Closure has no Record<K,V>; use Object
      if (baseType === "Record")
        return "!Object";

      // Handle type parameters (generics)
      if (typeNode.typeParameters && typeNode.typeParameters.params.length > 0) {
        const typeParams = typeNode.typeParameters.params
          .map(param => getTypeText(param, imports))
          .join(", ");
        return `!${baseType}<${typeParams}>`;
      }

      return `!${baseType}`;
    }
    case "TSUnionType": {
      const types = typeNode.types.map(t =>
        getTypeText(t, imports, false)
      ).join("|");
      return topLevel ? types : `(${types})`;
    }
    case "TSLiteralType":
      if (typeNode.literal.type === "StringLiteral") {
        return `"${typeNode.literal.value}"`;
      } else if (typeNode.literal.type === "NumericLiteral") {
        return typeNode.literal.value.toString();
      } else if (typeNode.literal.type === "BooleanLiteral") {
        return typeNode.literal.value.toString();
      }
      return "*";
    case "TSFunctionType": {
      // Process function parameters
      const params = typeNode.parameters || [];
      const paramTypes = params.map(param => {
        let type = param.typeAnnotation ?
          getTypeText(param.typeAnnotation.typeAnnotation, imports) :
          "*";
        if (param.optional)
          type += "=";
        return type;
      });

      // Process return type
      let returnType = typeNode.typeAnnotation ?
        getTypeText(typeNode.typeAnnotation.typeAnnotation, imports) :
        "*";
      returnType = returnType == "void" ? "" : ": " + returnType;

      // Format as function(param1Type, param2Type): returnType
      return `function(${paramTypes.join(", ")})${returnType}`;
    }
    default:
      return "*";
  }
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
    if (defaultExportProps.length > 0) {
      code += `\nexport default { ${defaultExportProps.join(", ")} };`;
    } else {
      code += "\nexport default {};";
    }
  }
  return code;
}

export {
  generatePlaceholder,
  pathToNamespace,
  transpile
};

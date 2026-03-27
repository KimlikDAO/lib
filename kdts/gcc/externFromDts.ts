/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js).
 *
 * @author KimlikDAO
 */
import {
  Comment,
  Identifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Program,
} from "acorn";
import { resolvePath, SourcePath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { generate } from "../generator/kdjsFromAst";
import { SourceId } from "../model/moduleImport";
import { DtsParser } from "../parser/tsParser";
import { toIdentifier } from "./generator";
import { transpileJsDoc } from "./jsdoc";

type SymbolRef = {
  source: SourceId;
  exportedName?: string;
  space: "type" | "value" | "namespace";
};

type BoundIdentifier = Identifier & {
  symbolRef?: SymbolRef;
};

type Binding = {
  ref: SymbolRef;
};

type DtsNode = any;
type DtsProgram = Program & { body: DtsNode[] };
type DtsImportSpecifier = ImportSpecifier & {
  importKind?: "type" | "value";
  local: BoundIdentifier;
};
type DtsImportClause =
  | (ImportDefaultSpecifier & { local: BoundIdentifier })
  | (ImportNamespaceSpecifier & { local: BoundIdentifier })
  | DtsImportSpecifier;
type DtsImportDeclaration = DtsNode & {
  type: "ImportDeclaration";
  importKind?: "type" | "value";
  source: { value: unknown };
  specifiers: DtsImportClause[];
};
type TypeScope = {
  names: Set<string>;
  parent?: TypeScope;
};

const TOP_LEVEL_DECLARATIONS = new Set([
  "ClassDeclaration",
  "TSDeclareFunction",
  "TSEnumDeclaration",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "VariableDeclaration",
]);

const isIdentifier = (node: any): node is BoundIdentifier =>
  node?.type == "Identifier";

const isImportDeclaration = (node: any): node is DtsImportDeclaration =>
  node?.type == "ImportDeclaration";

const isImportDefaultSpecifier = (specifier: any): specifier is ImportDefaultSpecifier =>
  specifier.type == "ImportDefaultSpecifier";

const isImportNamespaceSpecifier = (specifier: any): specifier is ImportNamespaceSpecifier =>
  specifier.type == "ImportNamespaceSpecifier";

const isImportSpecifier = (specifier: any): specifier is DtsImportSpecifier =>
  specifier.type == "ImportSpecifier";

const getImportedName = (specifier: ImportSpecifier): string =>
  specifier.imported.type == "Identifier"
    ? specifier.imported.name
    : String(specifier.imported.value);

const transpileGeneratedJsDocs = (content: string, fileName: string): string => {
  let out = "";
  let last = 0;
  for (let start = content.indexOf("/*"); start != -1; start = content.indexOf("/*", last)) {
    const end = content.indexOf("*/", start + 2);
    if (end == -1) break;
    out += content.slice(last, start);
    out += transpileJsDoc({
      type: "Block",
      value: content.slice(start + 2, end),
      start,
      end: end + 2
    } as Comment,
      fileName
    );
    last = end + 2;
  }
  return out + content.slice(last);
};

const getDeclarationId = (node: DtsNode): BoundIdentifier | undefined => {
  if (!node) return;
  if (node.type == "VariableDeclaration")
    return node.declarations[0]?.id;
  return node.id;
};

const getDeclarationIds = (node: DtsNode): BoundIdentifier[] => {
  if (!node) return [];
  if (node.type == "VariableDeclaration")
    return node.declarations
      .map((declarator: any) => declarator.id)
      .filter(isIdentifier);
  return isIdentifier(node.id) ? [node.id] : [];
};

const getWrappedDeclaration = (node: DtsNode): DtsNode | null => {
  if (TOP_LEVEL_DECLARATIONS.has(node?.type))
    return node;
  if ((node.type == "ExportNamedDeclaration" || node.type == "ExportDefaultDeclaration")
    && TOP_LEVEL_DECLARATIONS.has(node.declaration?.type))
    return node.declaration;
  return null;
};

const pushTypeScope = (scope: TypeScope | undefined, typeParameters: any): TypeScope | undefined => {
  const params = typeParameters?.params ?? [];
  if (!params.length)
    return scope;

  const names = new Set<string>();
  for (const param of params)
    names.add(param.name);
  return { names, parent: scope };
};

const hasScopedType = (scope: TypeScope | undefined, name: string): boolean => {
  for (; scope; scope = scope.parent)
    if (scope.names.has(name))
      return true;
  return false;
};

const collectExportMap = (ast: DtsProgram): Map<string, string> => {
  const exportMap = new Map<string, string>();

  for (const node of ast.body) {
    if (node.type == "ExportNamedDeclaration") {
      const declaration = node.declaration;
      if (declaration)
        for (const id of getDeclarationIds(declaration))
          exportMap.set(id.name, id.name);

      for (const specifier of node.specifiers ?? []) {
        if (!isIdentifier(specifier.local)) continue;
        const exported = specifier.exported.type == "Identifier"
          ? specifier.exported.name
          : String(specifier.exported.value);
        exportMap.set(specifier.local.name, exported);
      }
    } else if (node.type == "ExportDefaultDeclaration"
      && node.declaration?.type == "ObjectExpression") {
      for (const property of node.declaration.properties ?? []) {
        if (property.type !== "Property" || !isIdentifier(property.value))
          continue;
        if (property.key.type == "Identifier")
          exportMap.set(property.value.name, property.key.name);
        else if (property.key.type == "Literal")
          exportMap.set(property.value.name, String(property.key.value));
      }
    }
  }

  return exportMap;
};

/**
 * Annotates the DTS AST with `symbolRef`s so djs generation can emit stable
 * Closure extern identifiers for imported and exported names.
 */
const bindDts = (ast: DtsProgram, currentSource: SourcePath): void => {
  const exportMap = collectExportMap(ast);
  const typeBindings = new Map<string, Binding>();
  const valueBindings = new Map<string, Binding>();

  const declareBinding = (name: string, ref: SymbolRef, spaces: Array<"type" | "value">) => {
    const binding = { ref };
    for (const space of spaces)
      (space == "type" ? typeBindings : valueBindings).set(name, binding);
  };

  const bindIdentifier = (
    node: any,
    bindings: Map<string, Binding>,
    scope?: TypeScope
  ) => {
    if (isIdentifier(node) && !hasScopedType(scope, node.name)) {
      const binding = bindings.get(node.name);
      if (binding)
        node.symbolRef = binding.ref;
    } else if (node?.type == "TSQualifiedName")
      bindIdentifier(node.left, bindings, scope);
    else if (node?.type == "MemberExpression")
      bindIdentifier(node.object, bindings, scope);
  };

  const bindTypeNode = (node: any, scope?: TypeScope): void => {
    if (!node) return;

    switch (node.type) {
      case "TSTypeAnnotation":
        bindTypeNode(node.typeAnnotation, scope);
        return;
      case "TSTypeReference":
        bindIdentifier(node.typeName, typeBindings, scope);
        bindTypeNode(node.typeArguments, scope);
        return;
      case "TSExpressionWithTypeArguments":
        bindIdentifier(node.expression, typeBindings, scope);
        bindTypeNode(node.typeArguments || node.typeParameters, scope);
        return;
      case "TSTypeParameterInstantiation":
        for (const param of node.params)
          bindTypeNode(param, scope);
        return;
      case "TSArrayType":
      case "TSParenthesizedType":
      case "TSTypeOperator":
        bindTypeNode(node.elementType || node.typeAnnotation, scope);
        return;
      case "TSTypeQuery":
        bindIdentifier(node.exprName, valueBindings, scope);
        return;
      case "TSUnionType":
      case "TSIntersectionType":
        for (const type of node.types)
          bindTypeNode(type, scope);
        return;
      case "TSTypeLiteral":
      case "TSInterfaceBody":
        for (const member of node.members || node.body)
          bindDeclaration(member, scope);
        return;
      case "TSMethodSignature":
      case "TSFunctionType":
      case "TSConstructorType":
        bindFunctionLike(node, scope);
        return;
      case "TSPropertySignature":
      case "PropertyDefinition":
        bindTypeNode(node.typeAnnotation, scope);
        return;
      case "TSIndexedAccessType":
        bindTypeNode(node.objectType, scope);
        bindTypeNode(node.indexType, scope);
        return;
      case "TSConditionalType":
        bindTypeNode(node.checkType, scope);
        bindTypeNode(node.extendsType, scope);
        bindTypeNode(node.trueType, scope);
        bindTypeNode(node.falseType, scope);
        return;
      case "TSMappedType": {
        const mappedScope = node.typeParameter
          ? pushTypeScope(scope, { params: [node.typeParameter] })
          : scope;
        bindTypeNode(node.typeParameter?.constraint, scope);
        bindTypeNode(node.typeAnnotation, mappedScope);
        return;
      }
      case "TSTupleType":
        for (const elementType of node.elementTypes)
          bindTypeNode(elementType, scope);
        return;
      default:
        return;
    }
  };

  const bindParam = (param: any, scope?: TypeScope): void => {
    if (!param) return;

    switch (param.type) {
      case "Identifier":
        bindTypeNode(param.typeAnnotation, scope);
        return;
      case "RestElement":
        bindParam(param.argument, scope);
        bindTypeNode(param.typeAnnotation, scope);
        return;
      case "AssignmentPattern":
        bindParam(param.left, scope);
        return;
      case "TSParameterProperty":
        bindParam(param.parameter, scope);
        return;
      case "ObjectPattern":
      case "ArrayPattern":
        bindTypeNode(param.typeAnnotation, scope);
        return;
      default:
        return;
    }
  };

  const bindFunctionLike = (node: any, scope?: TypeScope): void => {
    const fnScope = pushTypeScope(scope, node.typeParameters);
    for (const param of node.params || node.parameters || [])
      bindParam(param, fnScope);
    bindTypeNode(node.returnType || node.typeAnnotation, fnScope);
  };

  const bindValueNode = (node: any, scope?: TypeScope): void => {
    if (!node) return;

    switch (node.type) {
      case "Identifier":
        bindIdentifier(node, valueBindings, scope);
        return;
      case "Property":
        if (node.computed)
          bindValueNode(node.key, scope);
        bindValueNode(node.value, scope);
        return;
      case "ObjectExpression":
        for (const property of node.properties || [])
          bindValueNode(property, scope);
        return;
      case "ArrayExpression":
        for (const element of node.elements || [])
          bindValueNode(element, scope);
        return;
      case "MemberExpression":
        bindIdentifier(node.object, valueBindings, scope);
        if (node.computed)
          bindValueNode(node.property, scope);
        return;
      case "CallExpression":
      case "NewExpression":
        bindValueNode(node.callee, scope);
        for (const arg of node.arguments || [])
          bindValueNode(arg, scope);
        return;
      case "ChainExpression":
      case "ParenthesizedExpression":
        bindValueNode(node.expression, scope);
        return;
      case "TSAsExpression":
      case "TSSatisfiesExpression":
        bindValueNode(node.expression, scope);
        return;
      default:
        return;
    }
  };

  const bindClassMember = (node: any, scope?: TypeScope): void => {
    switch (node.type) {
      case "MethodDefinition":
        bindFunctionLike(node.value, pushTypeScope(scope, node.typeParameters));
        return;
      case "PropertyDefinition":
        bindTypeNode(node.typeAnnotation, scope);
        return;
      default:
        bindDeclaration(node, scope);
    }
  };

  const bindDeclaration = (node: any, scope?: TypeScope): void => {
    if (!node) return;

    switch (node.type) {
      case "TSInterfaceDeclaration": {
        const localScope = pushTypeScope(scope, node.typeParameters);
        for (const iface of node.extends || [])
          bindTypeNode(iface, localScope);
        bindDeclaration(node.body, localScope);
        return;
      }
      case "TSTypeAliasDeclaration": {
        const localScope = pushTypeScope(scope, node.typeParameters);
        bindTypeNode(node.typeAnnotation, localScope);
        return;
      }
      case "ClassDeclaration":
        bindIdentifier(node.superClass, valueBindings, scope);
        for (const iface of node.implements || [])
          bindTypeNode(iface, scope);
        for (const member of node.body?.body || [])
          bindClassMember(member, scope);
        return;
      case "TSDeclareFunction":
      case "FunctionDeclaration":
        bindFunctionLike(node, scope);
        return;
      case "VariableDeclaration":
        for (const declarator of node.declarations) {
          if (isIdentifier(declarator.id))
            bindTypeNode(declarator.id.typeAnnotation, scope);
        }
        return;
      case "TSMethodSignature":
      case "TSFunctionType":
      case "TSConstructorType":
        bindFunctionLike(node, scope);
        return;
      case "TSPropertySignature":
      case "PropertyDefinition":
        bindTypeNode(node.typeAnnotation, scope);
        return;
      case "TSInterfaceBody":
      case "TSTypeLiteral":
        for (const member of node.body || node.members)
          bindDeclaration(member, scope);
        return;
      default:
        bindTypeNode(node, scope);
    }
  };

  for (const node of ast.body) {
    if (isImportDeclaration(node)) {
      const source = resolvePath(currentSource.path, String(node.source.value)).source;
      const importIsTypeOnly = node.importKind == "type";

      for (const specifier of node.specifiers) {
        if (isImportDefaultSpecifier(specifier) || isImportNamespaceSpecifier(specifier)) {
          const ref: SymbolRef = { source, space: "namespace" };
          if (!importIsTypeOnly)
            declareBinding(specifier.local.name, ref, ["type", "value"]);
          else
            declareBinding(specifier.local.name, ref, ["type"]);
        } else if (isImportSpecifier(specifier)) {
          const ref: SymbolRef = {
            source,
            exportedName: getImportedName(specifier),
            space: importIsTypeOnly || specifier.importKind == "type" ? "type" : "value"
          };
          if (ref.space == "type")
            declareBinding(specifier.local.name, ref, ["type"]);
          else
            declareBinding(specifier.local.name, ref, ["type", "value"]);
        }
      }
      continue;
    }

    const declaration = getWrappedDeclaration(node);
    if (!declaration) continue;

    if (declaration.type == "VariableDeclaration") {
      for (const id of getDeclarationIds(declaration)) {
        const exportedName = exportMap.get(id.name) || id.name;
        const ref: SymbolRef = { source: currentSource.source, exportedName, space: "value" };
        id.symbolRef = ref;
        declareBinding(id.name, ref, ["value"]);
      }
      continue;
    }

    const id = getDeclarationId(declaration);
    if (!id) continue;

    const exportedName = exportMap.get(id.name) || id.name;
    let ref: SymbolRef;
    let spaces: Array<"type" | "value">;

    switch (declaration.type) {
      case "ClassDeclaration":
        ref = { source: currentSource.source, exportedName, space: "value" };
        spaces = ["type", "value"];
        break;
      case "TSDeclareFunction":
        ref = { source: currentSource.source, exportedName, space: "value" };
        spaces = ["value"];
        break;
      default:
        ref = { source: currentSource.source, exportedName, space: "type" };
        spaces = declaration.type == "TSEnumDeclaration" ? ["type", "value"] : ["type"];
        break;
    }

    id.symbolRef = ref;
    declareBinding(id.name, ref, spaces);
  }

  for (const node of ast.body) {
    const declaration = getWrappedDeclaration(node);
    if (declaration)
      bindDeclaration(declaration);
    else if (node.type == "ExportDefaultDeclaration")
      bindValueNode(node.declaration);
  }
};

const emitDefaultExportExpression = (
  source: SourceId,
  declaration: DtsNode
): string =>
  `const ${toIdentifier(source, "default")} = ${generate(declaration, { djs: true })};\n`;

/**
 * Converts a resolved `.d.ts` source into a Closure extern module while
 * enqueueing imported declaration dependencies into the shared SourceSet.
 */
const transpileDts = (
  sourcePath: SourcePath,
  content: string,
  sources: SourceSet
): string => {
  const ast = DtsParser.parse(content);
  bindDts(ast, sourcePath);

  let output = "/** @fileoverview @externs */\n";
  for (const node of ast.body) {
    switch (node.type) {
      case "ImportDeclaration":
        sources.add(resolvePath(sourcePath.path, "" + node.source.value));
        break;
      case "ExportDefaultDeclaration": {
        const declaration = getWrappedDeclaration(node);
        if (declaration)
          output += generate(declaration, { djs: true }) + "\n";
        else if (node.declaration)
          output += emitDefaultExportExpression(sourcePath.source, node.declaration);
        break;
      }
      default:
        const declaration = getWrappedDeclaration(node);
        output += generate(declaration, { djs: true }) + "\n";
    }
  }
  return transpileGeneratedJsDocs(output, sourcePath.path);
};

export {
  bindDts,
  transpileDts
};

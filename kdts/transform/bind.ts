import {
  Identifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Program,
} from "acorn";
import { resolvePath } from "../frontend/resolver";
import { Source } from "../model/source";
import { SymbolRef } from "../model/symbolRef";

type BoundIdentifier = Identifier & {
  symbolRef?: SymbolRef;
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

const bindDts = (ast: DtsProgram, currentSource: Source): void => {
  const exportMap = collectExportMap(ast);
  const bindings = new Map<string, SymbolRef>();

  const declareBinding = (name: string, ref: SymbolRef) => {
    bindings.set(name, ref);
  };

  const bindIdentifier = (node: any, scope?: TypeScope) => {
    if (isIdentifier(node) && !hasScopedType(scope, node.name)) {
      const ref = bindings.get(node.name);
      if (ref)
        node.symbolRef = ref;
    } else if (node?.type == "TSQualifiedName")
      bindIdentifier(node.left, scope);
    else if (node?.type == "MemberExpression")
      bindIdentifier(node.object, scope);
  };

  const bindTypeNode = (node: any, scope?: TypeScope): void => {
    if (!node) return;

    switch (node.type) {
      case "TSTypeAnnotation":
        bindTypeNode(node.typeAnnotation, scope);
        return;
      case "TSTypeReference":
        bindIdentifier(node.typeName, scope);
        bindTypeNode(node.typeArguments, scope);
        return;
      case "TSImportType":
        bindIdentifier(node.qualifier, scope);
        bindTypeNode(node.typeArguments, scope);
        return;
      case "TSExpressionWithTypeArguments":
        bindIdentifier(node.expression, scope);
        bindTypeNode(node.typeArguments || node.typeParameters, scope);
        return;
      case "TSTypeParameterInstantiation":
        for (const param of node.params)
          bindTypeNode(param, scope);
        return;
      case "TSArrayType":
      case "TSParenthesizedType":
      case "TSTypeOperator":
      case "TSOptionalType":
      case "TSRestType":
        bindTypeNode(node.elementType || node.typeAnnotation, scope);
        return;
      case "TSTypeQuery":
        if (node.exprName?.type == "TSImportType")
          bindTypeNode(node.exprName, scope);
        else
          bindIdentifier(node.exprName, scope);
        return;
      case "TSUnionType":
      case "TSIntersectionType":
        for (const type of node.types)
          bindTypeNode(type, scope);
        return;
      case "TSNamedTupleMember":
        bindTypeNode(node.elementType, scope);
        return;
      case "TSTypeLiteral":
      case "TSInterfaceBody":
        for (const member of node.members || node.body)
          bindDeclaration(member, scope);
        return;
      case "TSCallSignatureDeclaration":
      case "TSConstructSignatureDeclaration":
      case "TSMethodSignature":
      case "TSFunctionType":
      case "TSConstructorType":
        bindFunctionLike(node, scope);
        return;
      case "TSIndexSignature":
        for (const param of node.parameters || [])
          bindParam(param, scope);
        bindTypeNode(node.typeAnnotation, scope);
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
      case "TSTypePredicate":
        bindIdentifier(node.parameterName, scope);
        bindTypeNode(node.typeAnnotation, scope);
        return;
      case "TSInferType":
        bindTypeNode(node.typeParameter?.constraint, scope);
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
        bindIdentifier(node, scope);
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
        bindIdentifier(node.object, scope);
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
        bindIdentifier(node.superClass, scope);
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
      const source = resolvePath(currentSource.path, String(node.source.value)).id;

      for (const specifier of node.specifiers) {
        if (isImportDefaultSpecifier(specifier) || isImportNamespaceSpecifier(specifier)) {
          declareBinding(specifier.local.name, { source });
        } else if (isImportSpecifier(specifier)) {
          declareBinding(specifier.local.name, {
            source,
            exportedName: getImportedName(specifier),
          });
        }
      }
      continue;
    }

    const declaration = getWrappedDeclaration(node);
    if (!declaration) continue;

    if (declaration.type == "VariableDeclaration") {
      for (const id of getDeclarationIds(declaration)) {
        const ref: SymbolRef = {
          source: currentSource.id,
          exportedName: exportMap.get(id.name) || id.name
        };
        id.symbolRef = ref;
        declareBinding(id.name, ref);
      }
      continue;
    }

    const id = getDeclarationId(declaration);
    if (!id) continue;

    const ref: SymbolRef = {
      source: currentSource.id,
      exportedName: exportMap.get(id.name) || id.name
    };
    id.symbolRef = ref;
    declareBinding(id.name, ref);
  }

  for (const node of ast.body) {
    const declaration = getWrappedDeclaration(node);
    if (declaration)
      bindDeclaration(declaration);
    else if (node.type == "ExportDefaultDeclaration")
      bindValueNode(node.declaration);
  }
};

export {
  bindDts,
  getWrappedDeclaration,
};

import {
  AnyNode,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Node,
  Options,
  Parser,
  Program,
} from "acorn";
import { update, Update } from "../util/textual";

type Scope = {
  lexical?: string[];
  functions?: string[];
  var?: string[];
};

type ImportLocalSpecifier =
  | ImportSpecifier
  | ImportDefaultSpecifier
  | ImportNamespaceSpecifier;

type ImportDeclarationInfo = {
  node: ImportDeclaration;
  specifiers: ImportSpecifierInfo[];
};

type ImportSpecifierInfo = {
  node: ImportLocalSpecifier;
  statement: ImportDeclarationInfo;
  keep: boolean;
};

type IdentifierScopeInfo = {
  node: Identifier;
  scopes: Scope[];
};

type ParserWithInternals = Parser & {
  scopeStack: Scope[];
  kdtsIdentifierScopes: IdentifierScopeInfo[];
  kdtsScopesByIdentifier: Map<Identifier, Scope[]>;
  kdtsImportStatements: ImportDeclarationInfo[];
  parseIdent(liberal?: boolean): Identifier;
  parseImport(node: Node): ImportDeclaration;
  copyNode<T extends AnyNode>(node: T): T;
};

type ParserWithInternalsCtor = typeof Parser & {
  new(options: Options, input: string, startPos?: number): ParserWithInternals;
};

const kdtsPlugin = () => (BaseParser: typeof Parser): typeof Parser => {
  const base = BaseParser.prototype as unknown as ParserWithInternals;

  class KdjsParserWithPlugin extends BaseParser {
    kdtsIdentifierScopes: IdentifierScopeInfo[] = [];
    kdtsScopesByIdentifier = new Map<Identifier, Scope[]>();
    kdtsImportStatements: ImportDeclarationInfo[] = [];
    declare scopeStack: Scope[];

    constructor(options: Options, input: string, startPos?: number) {
      super(options, input, startPos);
    }

    parseIdent(liberal?: boolean): Identifier {
      const node = base.parseIdent.call(this as unknown as ParserWithInternals, liberal);
      const scopes = this.scopeStack.slice();
      this.kdtsIdentifierScopes.push({ node, scopes });
      this.kdtsScopesByIdentifier.set(node, scopes);
      return node;
    }

    parseImport(node: Node): ImportDeclaration {
      const importNode = base.parseImport.call(this as unknown as ParserWithInternals, node);
      const statement: ImportDeclarationInfo = {
        node: importNode,
        specifiers: [],
      };
      for (const specifier of importNode.specifiers) {
        statement.specifiers.push({
          node: specifier,
          statement,
          keep: false,
        });
      }
      this.kdtsImportStatements.push(statement);
      return importNode;
    }

    copyNode<T extends AnyNode>(node: T): T {
      const copied = base.copyNode.call(this as unknown as ParserWithInternals, node);
      if (node.type === "Identifier") {
        const scopes = this.kdtsScopesByIdentifier.get(node);
        if (scopes) {
          const copiedIdentifier = copied as Identifier;
          this.kdtsIdentifierScopes.push({ node: copiedIdentifier, scopes });
          this.kdtsScopesByIdentifier.set(copiedIdentifier, scopes);
        }
      }
      return copied;
    }
  }

  return KdjsParserWithPlugin as unknown as typeof Parser;
};

const KdjsParser = Parser.extend(kdtsPlugin()) as ParserWithInternalsCtor;

const serializeNamedSpecifier = (specifier: ImportSpecifier, content: string): string => {
  const imported = content.slice(specifier.imported.start, specifier.imported.end);
  return specifier.imported.type === "Identifier" && specifier.local.name === specifier.imported.name
    ? imported
    : `${imported} as ${specifier.local.name}`;
};

const serializeImportStatement = (
  importStatement: ImportDeclarationInfo,
  content: string
): string => {
  let defaultSpecifier: ImportDefaultSpecifier | null = null;
  let namespaceSpecifier: ImportNamespaceSpecifier | null = null;
  const namedSpecifiers: ImportSpecifier[] = [];

  for (const specifierInfo of importStatement.specifiers) {
    if (!specifierInfo.keep) continue;
    const { node } = specifierInfo;
    if (node.type === "ImportDefaultSpecifier")
      defaultSpecifier = node;
    else if (node.type === "ImportNamespaceSpecifier")
      namespaceSpecifier = node;
    else
      namedSpecifiers.push(node);
  }

  if (!defaultSpecifier && !namespaceSpecifier && !namedSpecifiers.length)
    return "";

  const { node } = importStatement;
  const source = content.slice(node.source.start, node.source.end);
  const suffix = content.slice(node.source.end, node.end);

  let out = "import";
  if (defaultSpecifier)
    out += ` ${defaultSpecifier.local.name}`;
  if (namespaceSpecifier)
    out += `${defaultSpecifier ? "," : ""} * as ${namespaceSpecifier.local.name}`;
  if (namedSpecifiers.length) {
    out += defaultSpecifier ? ",{" : "{";
    out += namedSpecifiers.map((specifier) => serializeNamedSpecifier(specifier, content)).join(",");
    out += "}";
  }
  return out + " from" + source + suffix;
};

const isValueReference = (
  node: Identifier,
  parent?: AnyNode,
  grandparent?: AnyNode
): boolean => {
  if (!parent) return false;

  switch (parent.type) {
    case "ArrayPattern":
    case "ArrowFunctionExpression":
    case "BreakStatement":
    case "CatchClause":
    case "ContinueStatement":
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ImportDefaultSpecifier":
    case "ImportNamespaceSpecifier":
    case "ImportSpecifier":
    case "LabeledStatement":
    case "MetaProperty":
      return false;

    case "AssignmentPattern":
      return parent.right === node;

    case "ClassDeclaration":
    case "ClassExpression":
      return parent.superClass === node;

    case "ExportSpecifier":
      return parent.local === node
        && grandparent?.type === "ExportNamedDeclaration"
        && !grandparent.source;

    case "ImportAttribute":
      return parent.value === node;

    case "MemberExpression":
      return parent.object === node || parent.computed;

    case "MethodDefinition":
    case "PropertyDefinition":
      return parent.key !== node || parent.computed;

    case "Property":
      if (parent.key === node)
        return parent.computed;
      return grandparent?.type !== "ObjectPattern";

    case "RestElement":
      return false;

    case "VariableDeclarator":
      return parent.init === node;

    default:
      return true;
  }
};

const isShadowed = (name: string, scopes: Scope[]): boolean => {
  for (let i = scopes.length - 1; i > 0; --i) {
    const scope = scopes[i];
    if (scope.lexical?.includes(name)
      || scope.functions?.includes(name)
      || scope.var?.includes(name))
      return true;
  }
  return false;
};

const makeImportUpdate = (
  node: ImportDeclaration,
  replacement: string,
  content: string
): Update => {
  let end = node.end;
  if (!replacement) {
    if (content.charCodeAt(end) === 13 && content.charCodeAt(end + 1) === 10)
      end += 2;
    else if (content.charCodeAt(end) === 10 || content.charCodeAt(end) === 13)
      ++end;
  }
  return {
    beg: node.start,
    end,
    put: replacement,
  };
};

const markUsedImports = (
  node: AnyNode | null | undefined,
  scopesByIdentifier: Map<Identifier, Scope[]>,
  importsByLocalName: Map<string, ImportSpecifierInfo>,
  parent?: AnyNode,
  grandparent?: AnyNode
): void => {
  if (!node || typeof node !== "object") return;

  if (node.type === "Identifier") {
    const scopes = scopesByIdentifier.get(node);
    if (scopes && isValueReference(node, parent, grandparent) && !isShadowed(node.name, scopes))
      importsByLocalName.get(node.name)!.keep = true;
  }

  for (const child of Object.values(node as Record<string, unknown>)) {
    if (Array.isArray(child)) {
      for (const item of child)
        markUsedImports(item as AnyNode | null | undefined, scopesByIdentifier, importsByLocalName, node, parent);
    } else
      markUsedImports(child as AnyNode | null | undefined, scopesByIdentifier, importsByLocalName, node, parent);
  }
};

const transpileKdjs = (content: string): string => {
  const parser = new KdjsParser({
    ecmaVersion: "latest",
    sourceType: "module",
  }, content);
  const ast = parser.parse() as Program;
  const importsByLocalName = new Map<string, ImportSpecifierInfo>();
  const scopesByIdentifier = new Map<Identifier, Scope[]>();
  const updates: Update[] = [];

  for (const importStatement of parser.kdtsImportStatements)
    for (const specifier of importStatement.specifiers)
      importsByLocalName.set(specifier.node.local.name, specifier);

  for (const identifierInfo of parser.kdtsIdentifierScopes)
    if (importsByLocalName.has(identifierInfo.node.name))
      scopesByIdentifier.set(identifierInfo.node, identifierInfo.scopes);

  markUsedImports(ast, scopesByIdentifier, importsByLocalName);

  for (const importStatement of parser.kdtsImportStatements) {
    if (!importStatement.specifiers.length
      || importStatement.specifiers.every((specifier) => specifier.keep))
      continue;

    updates.push(makeImportUpdate(
      importStatement.node,
      serializeImportStatement(importStatement, content),
      content
    ));
  }

  return update(content, updates);
};

export { transpileKdjs };

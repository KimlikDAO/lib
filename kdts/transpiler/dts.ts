/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js) using Acorn.
 *
 * @author KimlikDAO
 */
import type {
  ClassDeclaration,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  Node,
  Program,
} from "acorn";
import { combine, getDir } from "../../util/paths";
import { generate } from "../generator/kdjsFromAst";
import { TsParser } from "../parser/tsParser";
import { resolveExtension } from "../util/resolver";

const pathToNamespace = (filePath: string): string => {
  if (filePath.endsWith(".ts") || filePath.endsWith(".js"))
    filePath = filePath.slice(0, -3);
  return "kdts$$" + filePath.slice(0, -2).replaceAll("/", "$");
};

interface NamedDeclaration extends Node {
  id: Identifier;
}

interface TSInterfaceDeclaration extends NamedDeclaration {
  type: "TSInterfaceDeclaration";
}

interface TSTypeAliasDeclaration extends NamedDeclaration {
  type: "TSTypeAliasDeclaration";
}

interface TSEnumDeclaration extends NamedDeclaration {
  type: "TSEnumDeclaration";
}

type EmittedNode =
  | ClassDeclaration
  | TSInterfaceDeclaration
  | TSTypeAliasDeclaration
  | TSEnumDeclaration;

type DtsTopLevelNode = ImportDeclaration | EmittedNode | Node;
type DtsProgram = Program & { body: DtsTopLevelNode[] };

const isImportDeclaration = (node: DtsTopLevelNode): node is ImportDeclaration =>
  node.type === "ImportDeclaration";

const isEmittedNode = (node: DtsTopLevelNode): node is EmittedNode =>
  node.type === "ClassDeclaration"
  || node.type === "TSInterfaceDeclaration"
  || node.type === "TSTypeAliasDeclaration"
  || node.type === "TSEnumDeclaration";

const getImportSource = (node: ImportDeclaration): string =>
  String(node.source.value);

const isImportDefaultSpecifier = (
  specifier: ImportDeclaration["specifiers"][number]
): specifier is ImportDefaultSpecifier =>
  specifier.type === "ImportDefaultSpecifier";

const isImportSpecifier = (
  specifier: ImportDeclaration["specifiers"][number]
): specifier is ImportSpecifier =>
  specifier.type === "ImportSpecifier";

const getImportedName = (specifier: ImportSpecifier): string =>
  specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : String(specifier.imported.value);

/**
 * Collects type information from the AST, including imports and local definitions.
 */
const collectTypes = (ast: DtsProgram, importer: string): Map<string, string> => {
  const typeMap = new Map<string, string>();
  const importerPath = getDir(importer);
  const currentNamespace = pathToNamespace(importer);

  for (const node of ast.body)
    if (isEmittedNode(node)) {
      typeMap.set(node.id.name, `${currentNamespace}$${node.id.name}`);
    } else if (isImportDeclaration(node)) {
      const source = getImportSource(node);
      let sourcePath =
        source.startsWith("/") ? source.slice(1) : combine(importerPath, source);
      if (sourcePath.endsWith(".d"))
        sourcePath = resolveExtension(sourcePath);
      if (sourcePath.endsWith("d.ts")) {
        const importNamespace = pathToNamespace(sourcePath);
        for (const specifier of node.specifiers)
          if (isImportDefaultSpecifier(specifier))
            typeMap.set(specifier.local.name, importNamespace);
          else if (isImportSpecifier(specifier))
            typeMap.set(
              specifier.local.name,
              `${importNamespace}$${getImportedName(specifier)}`
            );
      }
    }
  return typeMap;
};

/**
 * Transpiles TypeScript declaration content to Google Closure Compiler format.
 */
const transpileDts = (content: string, sourcePath: string): string => {
  const ast = TsParser.parse(content) as DtsProgram;
  const typeMap = collectTypes(ast, sourcePath);

  let output = "/** @fileoverview @externs */\n";
  for (const node of ast.body)
    if (isImportDeclaration(node))
      output += `import "${getImportSource(node)}"; // kdts-djs: imports are for dependency crawling\n`;

  for (const node of ast.body)
    if (isEmittedNode(node))
      output += generate(node, typeMap) + "\n";
  return output;
};

export {
  pathToNamespace,
  transpileDts
};

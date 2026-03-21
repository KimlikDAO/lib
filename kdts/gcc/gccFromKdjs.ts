import {
  Options as AcornOptions,
  ClassDeclaration,
  Comment,
  Declaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Literal,
  ModuleDeclaration,
  ObjectExpression,
  parse,
  Program,
  Statement,
  VariableDeclaration,
  VariableDeclarator,
} from "acorn";
import { existsSync } from "node:fs";
import { combine, getDir } from "../../util/paths";
import {
  createExportStatement,
  createImportStatement,
  ExportStatement,
  ImportStatement,
} from "../util/modules";
import { serializeObjectExpressionWithLiteralKeys } from "../util/objects";
import { resolveExtension } from "../util/resolver";
import { Update, update } from "../util/textual";
import { pathToNamespace } from "./externFromDts";
import { transpileJsDoc } from "./jsdoc";

const PACKAGE_EXTERNS = "node_modules/@kimlikdao/lib/kdts/@types/";
const DECLARATION_FILE = /\.(d|e)\.(js|ts)$/;
const DJS_FILE = /\.(d|e)\.js$/;
const DTS_FILE = /\.(d|e)\.ts$/;

const ACORN_OPTIONS: AcornOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
};

type ImportLikeSpecifier =
  | ImportSpecifier
  | ImportDefaultSpecifier
  | ImportNamespaceSpecifier;

type TopLevelNode = Statement | ModuleDeclaration;

const exportStmtToExportMap = (exportStmt: ExportStatement): string => {
  const named = Object.entries(exportStmt.named);
  if (!exportStmt.unnamed && !named.length)
    return "";
  let out = '\nglobalThis["KimlikDAOCompiler_exports"] = {\n';
  out += named.map(([exported, local]) => `  "${exported}": ${local},\n`).join("");
  if (exportStmt.unnamed)
    out += `  "KDdefault": ${exportStmt.unnamed}\n`;
  out += "};\n";
  return out;
};

const isIdentifier = (node: Identifier | Literal): node is Identifier =>
  node.type === "Identifier";

const isImportDeclaration = (node: TopLevelNode): node is ImportDeclaration =>
  node.type === "ImportDeclaration";

const isExportDefaultDeclaration = (node: TopLevelNode): node is ExportDefaultDeclaration =>
  node.type === "ExportDefaultDeclaration";

const isExportNamedDeclaration = (node: TopLevelNode): node is ExportNamedDeclaration =>
  node.type === "ExportNamedDeclaration";

const isFunctionDeclaration = (node: Declaration): node is FunctionDeclaration =>
  node.type === "FunctionDeclaration";

const isClassDeclaration = (node: Declaration): node is ClassDeclaration =>
  node.type === "ClassDeclaration";

const isVariableDeclaration = (node: Declaration): node is VariableDeclaration =>
  node.type === "VariableDeclaration";

const getImportSource = (node: ImportDeclaration): string =>
  String(node.source.value);

const getImportedName = (specifier: ImportSpecifier): string =>
  isIdentifier(specifier.imported)
    ? specifier.imported.name
    : String(specifier.imported.value);

const getVariableName = (node: VariableDeclarator): string | null =>
  node.id.type === "Identifier" ? node.id.name : null;

const ensureImportStatement = (
  unlinkedImports: Map<string, ImportStatement>,
  sourceName: string
): ImportStatement => {
  let importStmt = unlinkedImports.get(sourceName);
  if (!importStmt) {
    importStmt = createImportStatement();
    unlinkedImports.set(sourceName, importStmt);
  }
  return importStmt;
};

const addImportSpecifier = (
  importStmt: ImportStatement,
  spec: ImportLikeSpecifier
): void => {
  if (spec.type === "ImportDefaultSpecifier")
    importStmt.unnamed = spec.local.name;
  else if (spec.type === "ImportNamespaceSpecifier") {
    importStmt.isNamespace = true;
    importStmt.unnamed = spec.local.name;
  } else
    importStmt.named[spec.local.name] = getImportedName(spec);
};

const addDeclarationExports = (
  exportStmt: ExportStatement,
  decl: Declaration
): void => {
  if (isFunctionDeclaration(decl))
    exportStmt.named[decl.id.name] = decl.id.name;
  else if (isClassDeclaration(decl))
    exportStmt.named[decl.id.name] = decl.id.name;
  else if (isVariableDeclaration(decl))
    for (const dec of decl.declarations) {
      const name = getVariableName(dec);
      if (name)
        exportStmt.named[name] = name;
    }
};

const addExportSpecifier = (
  exportStmt: ExportStatement,
  spec: ExportNamedDeclaration["specifiers"][number]
): void => {
  const exported = isIdentifier(spec.exported)
    ? spec.exported.name
    : String(spec.exported.value);
  const local = isIdentifier(spec.local)
    ? spec.local.name
    : String(spec.local.value);
  exportStmt.named[exported] = local;
};

const transpileJs = (
  isEntry: boolean,
  file: string,
  content: string,
  files: string[],
  globals: Record<string, unknown>,
  unlinkedImports: Map<string, ImportStatement>
): string => {
  const comments: Comment[] = [];
  const ast = parse(content, {
    ...ACORN_OPTIONS,
    onComment: comments,
  }) as Program;
  const updates: Update[] = [];
  const exportStmt = createExportStatement();

  let lastImportEnd = 0;
  const typeAliases: string[] = [];

  const processComment = (comment: Comment): void => {
    const defineIdx = comment.value.indexOf("@define");
    const ups = transpileJsDoc(comment, file);
    updates.push(...ups);
    if (defineIdx === -1)
      return;

    if (ups.length !== 1)
      throw new Error("@define should not have other types: " + comment.value);
    const constDeclIndex = content.indexOf("const", comment.end);
    if (constDeclIndex === -1)
      throw new Error("@define should be followed by a const declaration: " + comment.value);
    const equalIndex = content.indexOf("=", constDeclIndex);
    if (equalIndex === -1)
      throw new Error("@define should be followed by an assignment: " + comment.value);

    updates.push({
      beg: comment.start + defineIdx + 2,
      end: comment.start + defineIdx + 10,
      put: "@const ",
    });
    const symbol = content.substring(constDeclIndex + 5, equalIndex).trim();
    if (symbol in globals) {
      const semicolonIndex = content.indexOf(";", equalIndex);
      updates.push({
        beg: comment.end,
        end: semicolonIndex,
        put: `\nconst ${symbol} = /** @type {${ups[0].put}} */(${JSON.stringify(globals[symbol])})`,
      });
    }
  };

  for (const comment of comments)
    processComment(comment);

  if (DECLARATION_FILE.test(file) && !content.includes("@externs"))
    updates.push({
      beg: 0,
      end: 0,
      put: "/**\n * @fileoverview\n * @externs\n */\n",
    });

  const handleImportDeclaration = (node: ImportDeclaration): void => {
    const sourceName = getImportSource(node);
    let nextFile = "";
    let addBack = false;

    lastImportEnd = node.end;
    switch (sourceName.at(0)) {
      case "/":
        nextFile = sourceName.slice(1);
        break;
      case ".":
        nextFile = combine(getDir(file), sourceName);
        break;
      default: {
        const candidate = PACKAGE_EXTERNS + sourceName.replaceAll(":", "/") + ".d.js";
        if (existsSync(candidate)) {
          nextFile = candidate;
          addBack = !DJS_FILE.test(file);
          break;
        }
        if (!nextFile.startsWith("node_modules"))
          throw `nodejs support is not yet implemented (${file}, ${candidate})`;
      }
    }
    nextFile = resolveExtension(nextFile);
    files.push(nextFile);

    if (DECLARATION_FILE.test(file))
      updates.push({
        beg: node.start,
        end: node.end,
        put: "; // gcc-js: type only imports are removed",
      });
    else if (DECLARATION_FILE.test(nextFile)) {
      if (!nextFile.startsWith(PACKAGE_EXTERNS) && DTS_FILE.test(nextFile)) {
        const namespace = pathToNamespace(nextFile);
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportDefaultSpecifier") {
            typeAliases.push(`/** @const */\nconst ${specifier.local.name} = ${namespace};`);
          } else if (specifier.type === "ImportSpecifier") {
            typeAliases.push(
              `/** @const */\nconst ${specifier.local.name} = ${namespace}$${getImportedName(specifier)};`
            );
          } else if (specifier.type === "ImportNamespaceSpecifier") {
            typeAliases.push(`/** @const */\nconst ${specifier.local.name} = ${namespace}$$star;`);
          }
        }
      }
      updates.push({
        beg: node.start,
        end: node.end,
        put: "; // gcc-js: type only imports are removed",
      });
    } else if (nextFile.endsWith(".jsx") && !sourceName.endsWith(".jsx"))
      updates.push({
        beg: node.source.start,
        end: node.source.end,
        put: `"${sourceName}.jsx"`,
      });
    else if (nextFile.endsWith(".ts") && !sourceName.endsWith(".ts"))
      updates.push({
        beg: node.source.start,
        end: node.source.end,
        put: `"${sourceName}.ts"`,
      });
    else if (nextFile.endsWith(".css") && file.endsWith(".js"))
      throw `css files cannot be imported in js files (${file}->${nextFile})`;

    if (addBack) {
      const importStmt = ensureImportStatement(unlinkedImports, sourceName);
      for (const spec of node.specifiers as ImportLikeSpecifier[])
        addImportSpecifier(importStmt, spec);
    }
  };

  const handleExportDefaultDeclaration = (node: ExportDefaultDeclaration): void => {
    if (isEntry) {
      if (node.declaration.type === "Identifier") {
        exportStmt.unnamed = node.declaration.name;
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";",
        });
      } else if (node.declaration.type === "ObjectExpression") {
        exportStmt.unnamed = "KDdefault__";
        updates.push({
          beg: node.start,
          end: node.end,
          put: `const KDdefault__ = ${serializeObjectExpressionWithLiteralKeys(
            node.declaration as ObjectExpression,
            content
          )};`,
        });
      }
      return;
    }

    if (DJS_FILE.test(file))
      updates.push({
        beg: node.start,
        end: node.end,
        put: ";",
      });
  };

  const handleExportNamedDeclaration = (node: ExportNamedDeclaration): void => {
    if (DJS_FILE.test(file)) {
      updates.push({
        beg: node.start,
        end: node.end,
        put: ";",
      });
      return;
    }

    if (!isEntry)
      return;

    if (node.declaration) {
      addDeclarationExports(exportStmt, node.declaration);
    } else {
      for (const spec of node.specifiers)
        addExportSpecifier(exportStmt, spec);
      updates.push({
        beg: node.start,
        end: node.end,
        put: ";",
      });
    }
  };

  for (const node of ast.body as TopLevelNode[]) {
    if (isImportDeclaration(node))
      handleImportDeclaration(node);
    else if (isExportDefaultDeclaration(node))
      handleExportDefaultDeclaration(node);
    else if (isExportNamedDeclaration(node))
      handleExportNamedDeclaration(node);
  }

  if (typeAliases.length > 0)
    updates.push({
      beg: lastImportEnd,
      end: lastImportEnd + 1,
      put: "\n" + typeAliases.join("\n") + "\n",
    });

  return update(content, updates) + exportStmtToExportMap(exportStmt);
};

export { transpileJs };

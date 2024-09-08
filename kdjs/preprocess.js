import { parse } from "acorn";
import { simple } from "acorn-walk";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { combine, getDir } from "../util/paths";
import { ExportStatement, ImportStatement } from "./modules";
import { Update, update } from "./textual";
import { serializeWithStringKeys } from "./objects";

const PACKAGE_EXTERNS = "node_modules/@kimlikdao/kdjs/externs/";

/**
 * @param {string} fileName
 * @return {string}
 */
const ensureExtension = (fileName) => fileName.endsWith(".js") || fileName.endsWith(".jsx")
  ? fileName : fileName + ".js";

/**
 * @param {ExportStatement} exportStmt
 * @return {string}
 */
const exportStmtToExportMap = (exportStmt) => {
  const named = Object.entries(exportStmt.named);
  if (!exportStmt.unnamed && !named.length)
    return "";
  let out = '\nglobalThis["KimlikDAOCompiler_exports"] = {\n';
  out += named.map(([exported, local]) => `  "${exported}": ${local},\n`).join('');
  if (exportStmt.unnamed)
    out += `  "KDdefault": ${exportStmt.unnamed}\n`
  out += "};\n";
  return out;
}

/**
 * @param {string} entryFile
 * @param {string} file name of the file
 * @param {string} content contents of the file
 * @param {!Array<string>} files the stack of files, which will be pushed new files
 * @param {!Map<string, ImportStatement>} unlinkedImports
 * @return {string} the content after preprocessing
 */
const processJs = (entryFile, file, content, files, unlinkedImports) => {
  /** @const {!acorn.Program} */
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  /**
   * @const
   * @type {!Array<Update>}
   */
  const updates = [];
  /**
   * @const
   * @type {ExportStatement}
   */
  const exportStmt = {
    named: []
  };

  simple(ast, /** @type {!acorn.SimpleVisitor} */({
    ImportDeclaration(node) {
      /** @const {string} */
      const sourceName = node.source.value;
      /** @type {string} */
      let nextFile = "";
      /** @type {boolean} */
      let addBack = false;
      switch (sourceName.at(0)) {
        case "/": nextFile = ensureExtension(sourceName.slice(1)); break;
        case ".": nextFile = ensureExtension(combine(getDir(file), sourceName)); break;
        default:
          const t = PACKAGE_EXTERNS + sourceName.replaceAll(":", "/") + ".d.js";
          if (existsSync(t)) {
            nextFile = t;
            addBack = true;
            break;
          }
          if (!nextFile.startsWith("node_modules"))
            throw `nodejs support is not yet implemented (${file}, ${t})`;
      }
      files.push(nextFile);

      if (file.endsWith(".d.js") || nextFile.endsWith(".d.js")) {
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";"
        });
      }
      if (addBack) {
        let importStmt = unlinkedImports.get(sourceName);
        if (!importStmt) {
          importStmt = { named: {} };
          unlinkedImports.set(sourceName, importStmt);
        }
        for (const spec of node.specifiers) {
          if (spec.type == "ImportDefaultSpecifier")
            importStmt.unnamed = spec.local.name;
          else
            importStmt.named[spec.local.name] = spec.imported.name;
        }
      }
    },
    ExportDefaultDeclaration(node) {
      if (file == entryFile) {
        if (node.declaration.type == "Identifier") {
          exportStmt.unnamed = node.declaration.name;
          updates.push({
            beg: node.start,
            end: node.end,
            put: ";"
          });
        } else if (node.declaration.type == "ObjectExpression") {
          exportStmt.unnamed = "KDdefault__";
          updates.push({
            beg: node.start,
            end: node.end,
            put: `const KDdefault__ = ${serializeWithStringKeys(node.declaration, content)};`
          });
        }
      } else if (file.endsWith(".d.js"))
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";"
        });
    },
    ExportNamedDeclaration(node) {
      if (file.endsWith(".d.js")) {
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";"
        });
        return;
      }
      if (file != entryFile) return;
      if (node.declaration) {
        /** @const {!acorn.Declaration} */
        const decl = node.declaration;
        switch (decl.type) {
          case "FunctionDeclaration":
            exportStmt.named[/** @type {!acorn.FunctionDeclaration} */(decl).id.name] =
                /** @type {!acorn.FunctionDeclaration} */(decl).id.name;
            break;
          case "ClassDeclaration":
            exportStmt.named[/** @type {!acorn.ClassDeclaration} */(decl).id.name] =
                /** @type {!acorn.ClassDeclaration} */(decl).id.name;
            break;
          case "VariableDeclaration":
            for (const dec of /** @type {!acorn.VariableDeclaration} */(decl).declarations)
              exportStmt.named[dec.id.name] = dec.id.name;
            break;
        }
      } else {
        for (const spec of node.specifiers)
          exportStmt.named[spec.exported.name] = spec.local.name;
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";"
        })
      }
    },
  }));
  return update(content, updates) + exportStmtToExportMap(exportStmt);
}

/**
 * @param {string} entryFile
 * @param {string} file name of the file
 * @param {string} content of the file
 * @param {!Array<string>} files
 * @return {string} file after preprocessing
 */
const processJsx = (entryFile, file, content, files) => {
  /** @const {!Array<string>} */
  const lines = content.split("\n");
  /** @const {!Array<string>} */
  const result = [];

  let out = "";
  for (let i = 0; i < lines.length; ++i)
    if (lines[i].trim().startsWith("export const")) {
      if (i > 0) result.push(lines[i - 1]);
      result.push(lines[i]);
    } else if (lines[i].includes("import dom") && lines[i].includes("util/dom")) {
      const importName = lines[i].slice(
        lines[i].indexOf('"') + 1,
        lines[i].lastIndexOf('"'));
      files.push(importName.at(0) == "/"
        ? ensureExtension(importName.slice(1))
        : ensureExtension(combine(getDir(file), importName)));
      out = lines[i] + "\n\n";
    }
  return out + result.join("\n");
};

/**
 * @param {string} entryFile
 * @param {string} isolateDir
 * @param {!Array<string>=} externs
 * @return {!Promise<{
 *   unlinkedImports: !Map<string, ImportStatement>,
 *   allFiles: !Set<string>
 * }>}
 */
const preprocessAndIsolate = async (entryFile, isolateDir, externs) => {
  const unlinkedImports = new Map();
  /** @const {!Array<string>} */
  const files = [entryFile].concat(externs || []);
  /** @const {!Set<string>} */
  const allFiles = new Set();
  /** @const {!Array<!Promise<void>>} */
  const writePromises = [];

  for (let file; file = files.pop();) {
    if (allFiles.has(file)) continue;
    allFiles.add(file);
    /** @const {string} */
    const content = await readFile(file, "utf8");
    const newContent = file.endsWith(".jsx")
      ? processJsx(entryFile, file, content, files)
      : processJs(entryFile, file, content, files, unlinkedImports);
    const outFile = combine(isolateDir, file);
    writePromises.push(mkdir(getDir(outFile), { recursive: true })
      .then(() => writeFile(outFile, newContent)));
  }
  return Promise.all(writePromises).then(() => ({
    unlinkedImports,
    allFiles
  }));
}

export { preprocessAndIsolate };

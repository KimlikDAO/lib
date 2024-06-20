import { parse } from "acorn";
import { simple } from "acorn-walk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { combine, getDir } from "../util/paths";
import { ExportStatement, ImportStatement } from "./modules";
import { PACKAGE_EXTERNS, translateToLocal } from "./packageExterns";
import { Update, update } from "./textual";

/**
 * @param {string} fileName
 * @return {string}
 */
const ensureDotJs = (fileName) => fileName.endsWith(".js") ? fileName : fileName + ".js";

/**
 * @param {ExportStatement} exportStmt
 * @return {string}
 */
const exportStmtToExportMap = (exportStmt) => {
  if (!exportStmt.unnamed && !exportStmt.named.length)
    return "";
  let out = '\nglobalThis["KimlikDAOCompiler_exports"] = {\n';
  out += exportStmt.named.map((s) => `  "${s.exported}": ${s.local},\n`).join('');
  out += `  "KDdefault": ${exportStmt.unnamed}\n};\n`;
  return out;
}

/**
 * @param {string} entryFile
 * @param {string} isolateDir
 * @param {!Set<string>} splitSet
 * @param {!Set<string>} externsSet
 * @return {!Promise<{
 *   missingImports: !Map<string, ImportStatement>,
 *   allFiles: !Set<string>
 * }>}
 */
const preprocessAndIsolate = async (entryFile, isolateDir, splitSet, externsSet) => {
  const missingImports = new Map();
  /** @const {!Array<string>} */
  const files = [entryFile];
  /** @const {!Set<string>} */
  const allFiles = new Set();

  for (let file; file = files.pop();) {
    if (allFiles.has(file)) continue;
    allFiles.add(file);
    /** @const {string} */
    const content = readFileSync(file, "utf8");
    /** @const {!Program} */
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

    simple(ast, {
      ImportDeclaration(node) {
        let importedFile = node.source.value;
        let markedMissing = false;
        switch (importedFile.at(0)) {
          case "/": importedFile = ensureDotJs(importedFile.slice(1)); break;
          case ".": importedFile = ensureDotJs(combine(getDir(file), importedFile)); break;
          default:
            const maybeExtern = PACKAGE_EXTERNS + importedFile.replaceAll(":", "/") + ".d.js";
            if (existsSync(translateToLocal(maybeExtern))) {
              externsSet.add(maybeExtern);
              markedMissing = true;
              break;
            }
            if (splitSet.has(importedFile)) break;
            const maybeNodeModule = `node_modules/${importedFile}/index.js`;
            if (existsSync(maybeNodeModule)) {
              importedFile = maybeNodeModule;
              break;
            }
            throw "nodejs support is limited at this point";
        }
        if (markedMissing || splitSet.has(importedFile) || !existsSync(importedFile)) {
          let importStmt = missingImports.get(importedFile);
          if (!importStmt) {
            importStmt = { named: {} };
            missingImports.set(importedFile, importStmt);
          }
          for (const spec of node.specifiers) {
            if (spec.type == "ImportDefaultSpecifier")
              importStmt.unnamed = spec.local.name;
            else
              importStmt.named[spec.local.name] = spec.imported.name;
          }
          updates.push({
            beg: node.start,
            end: node.end,
            put: ";"
          })
        } else {
          // GGC currently does not support import from externs.
          if (file.endsWith(".d.js")) {
            updates.push({
              beg: node.start,
              end: node.end,
              put: ";"
            })
          }
          files.push(importedFile);
        }
      },
      ExportDefaultDeclaration(node) {
        if (file == entryFile) {
          exportStmt.unnamed = node.declaration.name;
          updates.push({
            beg: node.start,
            end: node.end,
            put: ";"
          });
        } else if (file.endsWith("d.js")) {
          updates.push({
            beg: node.start,
            end: node.end,
            put: ";"
          });
        }
      },
      ExportNamedDeclaration(node) {
        if (file != entryFile) return;
        if (node.declaration) {
          const decl = node.declaration;
          switch (decl.type) {
            case "FunctionDeclaration":
            case "ClassDeclaration":
              exportStmt.named.push({ exported: decl.id.name, local: decl.id.name });
              break;
            case "VariableDeclaration":
              exportStmt.push(...decl.declarations.map((dec) => ({
                exported: dec.id.name,
                local: dec.id.name,
              })));
          }
        } else {
          exportStmt.named.push(...node.specifiers.map((spec) => ({
            exported: spec.exported.name,
            local: spec.local.name
          })));
          updates.push({
            beg: node.start,
            end: node.end,
            put: ";"
          })
        }
      },
      ExportSpecifier(node) {
        throw "Not supported yet"; // TODO(KimlikDAO-bot): Evaluate whether to implement
      }
    });
    const newContent = update(content, updates) + exportStmtToExportMap(exportStmt);
    const outFile = combine(isolateDir, file);
    mkdirSync(getDir(outFile), { recursive: true });
    writeFileSync(outFile, newContent);
  }
  return {
    missingImports,
    allFiles
  }
}

export { preprocessAndIsolate };

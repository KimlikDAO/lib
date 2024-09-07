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
const ensureDotJs = (fileName) => fileName.endsWith(".js") ? fileName : fileName + ".js";

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
 * @param {string} isolateDir
 * @param {!Array<string>=} externs
 * @return {!Promise<{
 *   missingImports: !Map<string, ImportStatement>,
 *   allFiles: !Set<string>
 * }>}
 */
const preprocessAndIsolate = async (entryFile, isolateDir, externs) => {
  const missingImports = new Map();
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
          case "/": nextFile = ensureDotJs(sourceName.slice(1)); break;
          case ".": nextFile = ensureDotJs(combine(getDir(file), sourceName)); break;
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
          let importStmt = missingImports.get(sourceName);
          if (!importStmt) {
            importStmt = { named: {} };
            missingImports.set(sourceName, importStmt);
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
    const newContent = update(content, updates) + exportStmtToExportMap(exportStmt);
    const outFile = combine(isolateDir, file);
    writePromises.push(mkdir(getDir(outFile), { recursive: true })
      .then(() => writeFile(outFile, newContent)));
  }
  return Promise.all(writePromises).then(() => ({
    missingImports,
    allFiles
  }));
}

export { preprocessAndIsolate };

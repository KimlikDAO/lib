import { parse } from "acorn";
import { simple } from "acorn-walk";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { combine, getDir } from "../util/paths";
import { ExportStatement, ImportStatement } from "./modules";
import { serializeWithStringKeys } from "./objects";
import { Update, update } from "./textual";
import { pathToNamespace, transpile as transpileDeclaration } from "./transpiler/declaration";
import { transpile as transpileJsDoc } from "./transpiler/jsdoc";
import { resolveExtension } from "./util/resolver";

const PACKAGE_EXTERNS = "node_modules/@kimlikdao/kdjs/externs/";
const DeclarationFile = /\.d\.(js|ts)$/;

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
 * @param {boolean} isEntry
 * @param {string} file name of the file
 * @param {string} content contents of the file
 * @param {!Array<string>} files the stack of files, which will be pushed new files
 * @param {!Object<string, *>} globals
 * @param {!Map<string, ImportStatement>} unlinkedImports
 * @return {string} the content after preprocessing
 */
const processJs = (isEntry, file, content, files, globals, unlinkedImports) => {
  /** @const {!Array<!acorn.Comment>} */
  const comments = [];
  /** @const {!acorn.Program} */
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
    onComment: comments
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

  // Track declaration imports and their aliases
  /** @type {number} */
  let lastImportEnd = 0;
  /** @type {!Array<string>} */
  const typeAliases = [];

  /**
   * @param {!acorn.Comment} comment
   */
  const processComment = (comment) => {
    const defineIdx = comment.value.indexOf("@define");
    if (defineIdx == -1) {
      const ups = transpileJsDoc(comment);
      updates.push(...ups);
      return;
    };
    const constDeclIndex = content.indexOf("const", comment.end);
    if (constDeclIndex == -1) return;
    const equalIndex = content.indexOf("=", constDeclIndex);
    if (equalIndex == -1) return;

    const symbol = content.substring(constDeclIndex + 5, equalIndex).trim();
    if (symbol in globals) {
      const typeBeg = comment.value.indexOf("{", defineIdx) + 1;
      const typeEnd = comment.value.indexOf("}", typeBeg);
      const type = comment.value.slice(typeBeg, typeEnd).trim();
      const semicolonIndex = content.indexOf(';', equalIndex);
      const lineEndIndex = content.indexOf("\n", equalIndex);
      const assignmentEnd = semicolonIndex !== -1
        ? Math.min(semicolonIndex + 1, lineEndIndex) : lineEndIndex;

      updates.push({
        beg: comment.start + defineIdx + 2,
        end: comment.start + defineIdx + 9,
        put: "@const"
      }, {
        beg: comment.end,
        end: assignmentEnd,
        put: `\nconst ${symbol} = /** @type {${type}} */(${JSON.stringify(globals[symbol])});`
      });
    }
  }

  for (const comment of comments)
    processComment(comment);

  if (DeclarationFile.test(file) && !content.includes("@externs"))
    updates.push({
      beg: 0,
      end: 0,
      put: "/** @externs */\n"
    });

  simple(ast, /** @type {!acorn.SimpleVisitor} */({
    ImportDeclaration(node) {
      /** @const {string} */
      const sourceName = node.source.value;
      /** @type {string} */
      let nextFile = "";
      /** @type {boolean} */
      let addBack = false;

      lastImportEnd = node.end;
      switch (sourceName.at(0)) {
        case "/": nextFile = sourceName.slice(1); break;
        case ".": nextFile = combine(getDir(file), sourceName); break;
        default:
          const t = PACKAGE_EXTERNS + sourceName.replaceAll(":", "/") + ".d.js";
          if (existsSync(t)) {
            nextFile = t;
            addBack = !file.endsWith(".d.js");
            break;
          }
          if (!nextFile.startsWith("node_modules"))
            throw `nodejs support is not yet implemented (${file}, ${t})`;
      }
      nextFile = resolveExtension(nextFile);
      files.push(nextFile);

      if (DeclarationFile.test(file))
        updates.push({
          beg: node.start,
          end: node.end,
          put: "; // imports from declaration files are removed for gcc"
        });
      else if (DeclarationFile.test(nextFile)) {
        if (!nextFile.startsWith(PACKAGE_EXTERNS) && nextFile.endsWith("d.ts")) {
          const namespace = pathToNamespace(nextFile);
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportDefaultSpecifier") {
              // Default import: import name from "./path"
              typeAliases.push(`/** @const */\nconst ${specifier.local.name} = ${namespace};`);
            } else if (specifier.type === "ImportSpecifier") {
              // Named import: import { name } from "./path"
              typeAliases.push(
                `/** @const */\nconst ${specifier.local.name} = ${namespace}.${specifier.imported.name};`
              );
            }
          }
        }
        updates.push({
          beg: node.start,
          end: node.end,
          put: "; // type only import"
        });
      } else if (nextFile.endsWith(".jsx") && !sourceName.endsWith(".jsx"))
        updates.push({
          beg: node.source.start,
          end: node.source.end,
          put: `"${sourceName}.jsx"`
        })
      else if (nextFile.endsWith(".css") && file.endsWith(".js"))
        throw `css files cannot be imported in js files (${file}->${nextFile})`;

      if (addBack) {
        let importStmt = unlinkedImports.get(sourceName);
        if (!importStmt) {
          importStmt = { named: {} };
          unlinkedImports.set(sourceName, importStmt);
        }
        for (const spec of node.specifiers) {
          if (spec.type == "ImportDefaultSpecifier")
            importStmt.unnamed = spec.local.name;
          else if (spec.type == "ImportNamespaceSpecifier") {
            importStmt.isNamespace = true;
            importStmt.unnamed = spec.local.name;
          } else
            importStmt.named[spec.local.name] = spec.imported.name;
        }
      }
    },
    ExportDefaultDeclaration(node) {
      if (isEntry) {
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
      if (!isEntry) return;
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
  if (typeAliases.length > 0)
    updates.push({
      beg: lastImportEnd,
      end: lastImportEnd + 1,
      put: "\n" + typeAliases.join("\n")
    });
  return update(content, updates) + exportStmtToExportMap(exportStmt);
}

/**
 * @param {!Object<string, *>} params
 * @param {function(string, string, boolean=):?string=} transpileFn
 * @return {!Promise<{
 *   unlinkedImports: !Map<string, ImportStatement>,
 *   allFiles: !Set<string>,
 *   isolateDir: string,
 *   ignoreUnusedLocals: boolean
 * }>}
 */
const preprocessAndIsolate = async (params, transpileFn) => {
  const entry = /** @type {string} */(params["entry"]);
  /** @const {string} */
  const isolateDir = combine(
    getDir(/** @type {string} */(params["output"] || "build/" + entry)),
    /** @type {string} */(params["isolateDir"]) || ".kdjs_isolate");
  /** @const {!Object<string, *>} */
  const globals = /** @type {!Object<string, *>} */(typeof params["globals"] == "string"
    ? JSON.parse(/** @type {string} */(params["globals"])) : (params["globals"] || {}));

  const unlinkedImports = new Map();
  /** @const {!Array<string>} */
  const externs = params["externs"] || [];
  /** @const {!Array<string>} */
  const files = [entry, ...externs];
  /** @const {!Set<string>} */
  const allFiles = new Set();
  /** @const {!Array<!Promise<void>>} */
  const writePromises = [];
  /** @type {boolean} */
  let ignoreUnusedLocals = false;

  for (let file; file = files.pop();) {
    if (allFiles.has(file)) continue;
    allFiles.add(file);
    /** @type {string} */
    let content = await readFile(file, "utf8");
    if (file.endsWith(".d.ts")) {
      content = transpileDeclaration(content, file);
    } else if (!file.endsWith(".js")) {
      if (!transpileFn) throw "For non-js files please provide a transpile function: " + file;
      /** @const {?string} */
      const transpiled = transpileFn(content, file, file == entry);
      content = transpiled || content;
      ignoreUnusedLocals ||= file.endsWith(".jsx") && !!transpiled;
    }
    content = processJs(file == entry, file, content, files, globals, unlinkedImports);

    const outFile = combine(isolateDir, file);
    writePromises.push(mkdir(getDir(outFile), { recursive: true })
      .catch(() => { })
      .then(() => writeFile(outFile, content)));
  }
  return Promise.all(writePromises).then(() => ({
    unlinkedImports,
    allFiles,
    isolateDir,
    ignoreUnusedLocals,
  }));
}

export { preprocessAndIsolate };

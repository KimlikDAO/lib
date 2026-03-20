import { parse } from "acorn";
import { simple } from "acorn-walk";
import { existsSync } from "node:fs";
import { combine, getDir } from "../../util/paths";
import { ExportStatement, ImportStatement } from "../util/modules";
import { serializeWithStringKeys } from "../util/objects";
import { resolveExtension } from "../util/resolver";
import { Update, update } from "../util/textual";
import { pathToNamespace } from "./dts";
import { transpileJsDoc } from "./jsdoc";

const PACKAGE_EXTERNS = "node_modules/@kimlikdao/lib/kdts/externs/";
const DeclarationFile = /\.(d|e)\.(js|ts)$/;

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
 * @param {string[]} files the stack of files, which will be pushed new files
 * @param {Record<string, unknown>} globals
 * @param {Map<string, ImportStatement>} unlinkedImports
 * @return {string} the content after preprocessing
 */
const transpileJs = (isEntry, file, content, files, globals, unlinkedImports) => {
  /** @const {acorn.Comment[]} */
  const comments = [];
  /** @const {acorn.Program} */
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
    onComment: comments
  });
  /**`
   * @const
   * @type {Update[]}
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
  /** @type {string[]} */
  const typeAliases = [];

  /**
   * @param {acorn.Comment} comment
   */
  const processComment = (comment) => {
    const defineIdx = comment.value.indexOf("@define");
    const ups = transpileJsDoc(comment, file);
    updates.push(...ups);
    if (defineIdx == -1) return;

    if (ups.length != 1)
      throw "@define should not have other types: " + comment.value;
    const constDeclIndex = content.indexOf("const", comment.end);
    if (constDeclIndex == -1)
      throw "@define should be followed by a const declaration: " + comment.value;
    const equalIndex = content.indexOf("=", constDeclIndex);
    if (equalIndex == -1)
      throw "@define should be followed by an assignment: " + comment.value;

    // Replace the @define with @const since in kdts-js we allow all
    // JSON serializable types, whereas gcc-js allows number string or boolean.
    updates.push({
      beg: comment.start + defineIdx + 2,
      end: comment.start + defineIdx + 10,
      put: "@const "
    });
    const symbol = content.substring(constDeclIndex + 5, equalIndex).trim();
    if (symbol in globals) {
      // TODO(KimlikDAO-bot): This is quite fragile, but have no better options
      // until we can fully parse jsdoc inside tsParser.
      const typeBeg = comment.value.indexOf("{", defineIdx) + 1;
      const typeEnd = comment.value.indexOf("}", typeBeg);
      const type = comment.value.slice(typeBeg, typeEnd).trim();
      const semicolonIndex = content.indexOf(';', equalIndex);
      updates.push({
        beg: comment.end,
        end: semicolonIndex,
        put: `\nconst ${symbol} = /** @type {${ups[0].put}} */(${JSON.stringify(globals[symbol])})`
      });
    }
  }

  for (const comment of comments)
    processComment(comment);

  if (DeclarationFile.test(file) && !content.includes("@externs"))
    updates.push({
      beg: 0,
      end: 0,
      put: "/**\n * @fileoverview\n * @externs\n */\n"
    });

  simple(ast, /** @type {acorn.SimpleVisitor} */({
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
          put: "; // gcc-js: type only imports are removed"
        });
      else if (DeclarationFile.test(nextFile)) {
        if (!nextFile.startsWith(PACKAGE_EXTERNS) &&
          (nextFile.endsWith("d.ts") || nextFile.endsWith("e.ts"))) {
          const namespace = pathToNamespace(nextFile);
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportDefaultSpecifier") {
              // Default import: import name from "./path"
              typeAliases.push(`/** @const */\nconst ${specifier.local.name} = ${namespace};`);
            } else if (specifier.type === "ImportSpecifier") {
              // Named import: import { name } from "./path"
              typeAliases.push(
                `/** @const */\nconst ${specifier.local.name} = ${namespace}$${specifier.imported.name};`
              );
            } else if (specifier.type === "ImportNamespaceSpecifier") {
              // Namespace import: import * as ns from "./path"
              typeAliases.push(`/** @const */\nconst ${specifier.local.name} = ${namespace}$$star;`);
            }
          }
        }
        updates.push({
          beg: node.start,
          end: node.end,
          put: "; // gcc-js: type only imports are removed"
        });
      } else if (nextFile.endsWith(".jsx") && !sourceName.endsWith(".jsx"))
        updates.push({
          beg: node.source.start,
          end: node.source.end,
          put: `"${sourceName}.jsx"`
        });
      else if (nextFile.endsWith(".ts") && !sourceName.endsWith(".ts"))
        updates.push({
          beg: node.source.start,
          end: node.source.end,
          put: `"${sourceName}.ts"`
        });
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
      } else if (file.endsWith(".d.js") || file.endsWith(".e.js"))
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";"
        });
    },
    ExportNamedDeclaration(node) {
      if (file.endsWith(".d.js") || file.endsWith(".e.js")) {
        updates.push({
          beg: node.start,
          end: node.end,
          put: ";"
        });
        return;
      }
      if (!isEntry) return;
      if (node.declaration) {
        /** @const {acorn.Declaration} */
        const decl = node.declaration;
        switch (decl.type) {
          case "FunctionDeclaration":
            exportStmt.named[/** @type {acorn.FunctionDeclaration} */(decl).id.name] =
                /** @type {acorn.FunctionDeclaration} */(decl).id.name;
            break;
          case "ClassDeclaration":
            exportStmt.named[/** @type {acorn.ClassDeclaration} */(decl).id.name] =
                /** @type {acorn.ClassDeclaration} */(decl).id.name;
            break;
          case "VariableDeclaration":
            for (const dec of /** @type {acorn.VariableDeclaration} */(decl).declarations)
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
      put: "\n" + typeAliases.join("\n") + "\n"
    });
  return update(content, updates) + exportStmtToExportMap(exportStmt);
}

export { transpileJs };

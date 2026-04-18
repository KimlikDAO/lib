import { Comment, parse } from "acorn";
import { getExt } from "../../util/paths";
import { resolvePath } from "../frontend/resolver";
import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/source";
import { Source } from "../model/source";
import { parseTypePrefix } from "../parser/typeParser";
import { CodeUpdater } from "../util/textual";
import { generateAliasImports } from "./generator";

const DECL_FILE = /\.(d|e)\.(js|ts)$/;

const TAGS_WITH_TYPES = new Set([
  "@type",
  "@const",
  "@typedef",
  "@private",
  "@param",
  "@return",
  "@define",
]);

const transpileJsDoc = (comment: Comment, fileName: string): string => {
  if (comment.type != "Block")
    return `//${comment.value}`;

  const value = comment.value;
  let out = "/*";
  let last = 0;

  for (let i = 0; i < value.length; ++i) {
    const ch = value.charCodeAt(i);
    if (ch !== 64) continue; // '@' character

    let tagEnd = i + 1;
    for (; tagEnd < value.length; ++tagEnd) {
      const tagChar = value.charCodeAt(tagEnd);
      if (tagChar < 97 || tagChar > 122) break;
    }

    const tag = value.slice(i, tagEnd);
    if (!TAGS_WITH_TYPES.has(tag))
      continue;

    let pos = tagEnd;
    for (; pos < value.length; ++pos) {
      const ws = value.charCodeAt(pos);
      if (ws !== 32 && ws !== 9 && ws !== 10 && ws !== 13)
        break;
    }

    if (value.charCodeAt(pos) !== 123) continue; // '{'

    const typeStart = pos + 1;
    try {
      const { type, endPos, paramOpt, paramRest } = parseTypePrefix(value, typeStart);
      if (value.charCodeAt(endPos) !== 125) continue; // '}'

      const closureExpr =
        (paramRest ? "..." : "") +
        type.toClosureExpr({ toParam: tag == "@param" && paramOpt });
      out += value.substring(last, typeStart) + closureExpr;
      last = endPos;
      i = endPos;
    } catch (e) {
      console.warn(
        "Cannot parse " + value.slice(typeStart, typeStart + 20) +
        "... in file " + fileName + ": " + e
      );
    }
  }
  return out + value.substring(last) + "*/";
};

/**
 * Transpiles a js file in kdjs convention to a form that is expected by gcc.
 *
 * In kdjs convention the file is fully typed in jsdoc but using ts type
 * expressions. Types are imported via regular es6 imports. The following needs
 * to be done for gcc conversion:
 *
 *  - Type imports should be replaced by extern alias imports
 *  - Every import at our link boundary should be replaced by alias imports and
 *    recorded for re-inclusion into the output module.
 *  - Jsdoc type expressions should be converted from ts to gcc.
 */
const transpileJs = (
  source: Source,
  content: string,
  sources: SourceSet,
  _overrides: Record<string, unknown>,
  imports: ModuleImports
): string => {
  const comments: Comment[] = [];
  const updater = new CodeUpdater();
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
    onComment: comments,
  });

  for (const comment of comments)
    if (comment.type == "Block")
      updater.replace(comment, transpileJsDoc(comment, source.path));

  const typeOnlyImports = new ModuleImports();
  let lastImportDeclaration;

  for (const node of ast.body) {
    switch (node.type) {
      case "ImportDeclaration":
        lastImportDeclaration = node;
        const importSource = "" + node.source.value;
        const resolvedImport = resolvePath(source.path, importSource);
        sources.add(resolvedImport);
        const importExt = "." + getExt(resolvedImport.path);

        if (resolvedImport.id.startsWith("package"))
          imports.add(node, resolvedImport.id);
        if (DECL_FILE.test(resolvedImport.path)) {
          updater.replace(node, "; // gcc-js: declaration imports are replaced by type alias imports");
          typeOnlyImports.add(node, resolvedImport.id);
        } else if (resolvedImport.id.startsWith("module") && !importSource.endsWith(importExt))
          updater.replace(node.source, `"${importSource}${importExt}"`)
        break;
    }
  }
  if (lastImportDeclaration)
    updater.insertAfter(lastImportDeclaration, "\n" + generateAliasImports(typeOnlyImports));
  return updater.apply(content);
};

export { transpileJs };

import { Comment, parse } from "acorn";
import { getExt } from "../../util/paths";
import { SourcePath, resolvePath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { ModuleImports } from "../model/moduleImport";
import { CodeUpdater } from "../util/textual";
import { generateAliasImports } from "./generator";
import { transpileJsDoc } from "./jsdoc";

const DECL_FILE = /\.(d|e)\.(js|ts)$/;

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
 *
 * @param source
 * @param content 
 * @param sources
 * @param globals 
 * @param unlinkedImports 
 * @returns 
 */
const transpileKdjs = (
  source: SourcePath,
  content: string,
  sources: SourceSet,
  _globals: Record<string, unknown>,
  unlinkedImports: ModuleImports
): string => {
  const comments: Comment[] = [];
  const updater = new CodeUpdater();
  const ast = parse(content, {
    ecmaVersion: "latest",
    sourceType: "module",
    onComment: comments,
  });

  for (const comment of comments)
    if (comment.type === "Block")
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

        if (resolvedImport.source.startsWith("package"))
          unlinkedImports.add(node, resolvedImport.source);
        if (DECL_FILE.test(resolvedImport.path)) {
          updater.replace(node, "; // gcc-js: declaration imports are replaced by type alias imports");
          typeOnlyImports.add(node, resolvedImport.source);
        } else if (resolvedImport.source.startsWith("module") && !importSource.endsWith(importExt))
          updater.replace(node.source, `"${importSource}${importExt}"`)
        break;
    }
  }
  if (lastImportDeclaration)
    updater.insertAfter(lastImportDeclaration, "\n" + generateAliasImports(typeOnlyImports));
  return updater.apply(content);
};

export { transpileKdjs };

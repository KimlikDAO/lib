/**
 * @fileoverview Transpiles TypeScript declaration files (.d.ts) to Google Closure
 * Compiler compatible declaration files (.d.js).
 *
 * @author KimlikDAO
 */
import { Comment } from "acorn";
import { resolvePath, SourcePath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { SourceId } from "../model/moduleImport";
import { DtsParser } from "../parser/tsParser";
import { bindDts, getWrappedDeclaration } from "../transform/bind";
import { toIdentifier } from "./generator";
import { transpileJsDoc } from "./jsdoc";
import { generate } from "./kdjsFromAst";

const transpileGeneratedJsDocs = (content: string, fileName: string): string => {
  let out = "";
  let last = 0;
  for (let start = content.indexOf("/*"); start != -1; start = content.indexOf("/*", last)) {
    const end = content.indexOf("*/", start + 2);
    if (end == -1) break;
    out += content.slice(last, start);
    out += transpileJsDoc({
      type: "Block",
      value: content.slice(start + 2, end),
      start,
      end: end + 2
    } as Comment,
      fileName
    );
    last = end + 2;
  }
  return out + content.slice(last);
};

const emitDefaultExportExpression = (
  source: SourceId,
  declaration: any
): string =>
  `const ${toIdentifier(source, "default")} = ${generate(declaration, { djs: true })};\n`;

/**
 * Converts a resolved `.d.ts` source into a Closure extern module while
 * enqueueing imported declaration dependencies into the shared SourceSet.
 */
const transpileDts = (
  sourcePath: SourcePath,
  content: string,
  sources: SourceSet
): string => {
  const ast = DtsParser.parse(content);
  bindDts(ast, sourcePath);

  let output = "/** @fileoverview @externs */\n";
  for (const node of ast.body) {
    switch (node.type) {
      case "ImportDeclaration":
        sources.add(resolvePath(sourcePath.path, "" + node.source.value));
        break;
      case "ExportDefaultDeclaration": {
        const declaration = getWrappedDeclaration(node);
        if (declaration)
          output += generate(declaration, { djs: true }) + "\n";
        else if (node.declaration)
          output += emitDefaultExportExpression(sourcePath.source, node.declaration);
        break;
      }
      default:
        const declaration = getWrappedDeclaration(node);
        output += generate(declaration, { djs: true }) + "\n";
    }
  }
  return transpileGeneratedJsDocs(output, sourcePath.path);
};

export { transpileDts };

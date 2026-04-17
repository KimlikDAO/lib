import { SourcePath } from "../frontend/resolver";
import { DtsParser, TsParser } from "../parser/tsParser";
import { bindDts } from "../transform/bind";
import { generate, generateAliasImports } from "./generator";
import type { GccProgram } from "./program";
import { GccExternTransform, GccJsTransform } from "./transform";

const transpileTs = (
  source: SourcePath,
  content: string,
  program: GccProgram
): string => {
  const ast = TsParser.parse(content);
  new GccJsTransform(source, program).mut(ast);
  return generate(ast);
}

const transpileDts = (
  source: SourcePath,
  content: string,
  program: GccProgram
): string => {
  const ast = DtsParser.parse(content);
  bindDts(ast, source);

  const transform = new GccExternTransform(source, program.sourceSet);
  transform.mut(ast);

  let output = "/** @fileoverview @externs */\n";
  output += generateAliasImports(transform.typeOnlyImports);
  output += generate(ast, { djs: true });
  return output;
}

export { transpileDts, transpileTs };

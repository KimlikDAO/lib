import { ModuleImports } from "../model/moduleImports";
import { SourceSet } from "../model/source";
import { Source } from "../model/source";
import { DtsParser, TsParser } from "../parser/tsParser";
import { bindDts } from "../transform/bind";
import { generate, generateAliasImports } from "./generator";
import { GccExternTransform, GccJsTransform } from "./transform";

const transpileTs = (
  source: Source,
  content: string,
  sources: SourceSet,
  overrides: Record<string, unknown>,
  imports: ModuleImports
): string => {
  const ast = TsParser.parse(content);
  new GccJsTransform(source, sources, overrides, imports).mut(ast);
  return generate(ast);
}

const transpileDts = (
  source: Source,
  content: string,
  sources: SourceSet
): string => {
  const ast = DtsParser.parse(content);
  bindDts(ast, source);

  const transform = new GccExternTransform(source, sources);
  transform.mut(ast);

  let output = "/** @fileoverview @externs */\n";
  output += generateAliasImports(transform.typeOnlyImports);
  output += generate(ast, { djs: true });
  return output;
}

export { transpileDts, transpileTs };

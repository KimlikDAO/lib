import { SourcePath } from "../frontend/resolver";
import { SourceSet } from "../frontend/sourceSet";
import { ModuleImports } from "../model/moduleImports";
import { DtsParser, TsParser } from "../parser/tsParser";
import { bindDts } from "../transform/bind";
import { generate, generateAliasImports } from "./generator";
import { GccExternTransform, GccJsTransform } from "./transform";

const transpileTs = (
  source: SourcePath,
  content: string,
  sources: SourceSet,
  overrides: Record<string, unknown> = {},
  unlinkedImports: ModuleImports
): string => {
  const ast = TsParser.parse(content);
  new GccJsTransform(source, sources, overrides, unlinkedImports).mut(ast);
  return generate(ast);
}

const transpileDts = (
  source: SourcePath,
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

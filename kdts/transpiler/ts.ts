import { generate } from "../generator/kdjsFromAst";
import { TsParser } from "../parser/tsParser";

const transpileTs = (content: string): string =>
  generate(TsParser.parse(content));

export { transpileTs };

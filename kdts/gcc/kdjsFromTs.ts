import { TsParser } from "../parser/tsParser";
import { generate } from "./kdjsFromAst";

const transpileTs = (content: string): string => {
  return generate(TsParser.parse(content));
}

export { transpileTs };

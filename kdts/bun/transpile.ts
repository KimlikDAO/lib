
import { BunTransform } from "./transform";
import { TsParser } from "../parser/tsParser";

const transpileTs = (
  content: string,
  overrides: Record<string, unknown>
): string => {
  if (!content.includes("Overridable") && !content.includes("PureExpr"))
    return content;
  const transform = new BunTransform(content, overrides);
  transform.mut(TsParser.parse(content));
  return transform.apply();
};

export { transpileTs };

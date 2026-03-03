import { generate } from "../generator/closureFromAst3";
import { TsParser } from "../parser/tsParser";

/**
 * @param {string} content TypeScript source. Must parse (e.g. const enums already replaced by bindings if needed).
 * @returns {string} kdjs-js: /** @enum *\/ const Name = { ... }; export { ... };
 */
const transpileTs = (content) => {
  const ast = TsParser.parse(content);
  return generate(ast);
};

export { transpileTs };

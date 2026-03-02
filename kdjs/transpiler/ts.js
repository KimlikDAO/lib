import { generateProgram } from "../generator/closureFromAst";
import { TsParser } from "../parser/tsParser";

/**
 * @param {string} content TypeScript source. Must parse (e.g. const enums already replaced by bindings if needed).
 * @returns {string} kdjs-js: /** @enum *\/ const Name = { ... }; export { ... };
 */
const transpileTs = (content) => {
  const ast = TsParser.parse(content, {
    sourceType: "module",
    ecmaVersion: "latest",
    locations: true,
  });
  return generateProgram(ast);
};

export { transpileTs };

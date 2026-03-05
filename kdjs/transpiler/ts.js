import { generate } from "../generator/kdjsFromAst";
import { TsParser } from "../parser/tsParser";

/**
 * @param {string} content
 * @returns {string}
 */
const transpileTs = (content) => generate(TsParser.parse(content));

export { transpileTs };

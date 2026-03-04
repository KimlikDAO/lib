import { generate } from "../generator/closureFromAst3";
import { TsParser } from "../parser/tsParser";

/**
 * @param {string} content
 * @returns {string}
 */
const transpileTs = (content) => generate(TsParser.parse(content));

export { transpileTs };

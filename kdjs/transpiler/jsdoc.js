import { Update } from "../util/textual";
import { parseTypePrefix } from "../types/parser";

/**
 * @const {Set<string>}
 */
const TAGS_WITH_TYPES = new Set([
  "@type", "@const", "@typedef", "@private", "@param", "@return", "@define"
]);

/**
 * Extracts and transpiles JSDoc type expressions
 * @param {{
 *   value: string,
 *   type: string,
 *   start: number,
 *   end: number
 * }} comment
 * @param {string} fileName
 * @return {Update[]}
 */
const transpileJsDoc = (comment, fileName) => {
  if (comment.type != "Block") return [];

  /** @const {Update[]} */
  const updates = [];
  const value = comment.value;

  // Find all @ tags with type expressions
  for (let i = 0; i < value.length; ++i) {
    const ch = value.charCodeAt(i);
    if (ch != 64) continue; // '@' character

    let tagEnd = i + 1;
    for (; tagEnd < value.length; ++tagEnd) {
      const ch = value.charCodeAt(tagEnd);
      if (ch < 97 || ch > 122) break;
    }

    const tag = value.slice(i, tagEnd);
    if (!TAGS_WITH_TYPES.has(tag)) continue;

    // Skip whitespace after tag
    let pos = tagEnd;
    for (; pos < value.length; ++pos) {
      const ch = value.charCodeAt(pos);
      // space=32, tab=9, LF=10, CR=13
      if (ch != 32 && ch != 9 && ch != 10 && ch != 13)
        break;
    }

    // Check for opening brace
    if (value.charCodeAt(pos) != 123) continue; // '{'

    const typeStart = pos + 1;
    try {
      const { type, endPos, paramOpt, paramRest } = parseTypePrefix(value, typeStart);
      if (value.charCodeAt(endPos) != 125) continue; // '}'

      const closureExpr = (paramRest ? "..." : "") +
        type.toClosureExpr({ toParam: tag == "@param" && paramOpt });
      updates.push({
        beg: comment.start + 2 + typeStart,
        end: comment.start + 2 + endPos,
        put: closureExpr
      });
      i = endPos; // Continue search after this type expression
    } catch (e) {
      console.warn("Cannot parse " + value.slice(typeStart, typeStart + 20)
        + "... in file " + fileName + ": " + e);
      continue;
    }
  }
  return updates;
};

export { transpileJsDoc };

import { Comment } from "acorn";
import { parseTypePrefix } from "../parser/typeParser";

const TAGS_WITH_TYPES = new Set([
  "@type",
  "@const",
  "@typedef",
  "@private",
  "@param",
  "@return",
  "@define",
]);

const transpileJsDoc = (comment: Comment, fileName: string): string => {
  if (comment.type !== "Block")
    return `//${comment.value}`;

  const value = comment.value;
  let out = "/*";
  let last = 0;

  for (let i = 0; i < value.length; ++i) {
    const ch = value.charCodeAt(i);
    if (ch !== 64) continue; // '@' character

    let tagEnd = i + 1;
    for (; tagEnd < value.length; ++tagEnd) {
      const tagChar = value.charCodeAt(tagEnd);
      if (tagChar < 97 || tagChar > 122) break;
    }

    const tag = value.slice(i, tagEnd);
    if (!TAGS_WITH_TYPES.has(tag))
      continue;

    let pos = tagEnd;
    for (; pos < value.length; ++pos) {
      const ws = value.charCodeAt(pos);
      if (ws !== 32 && ws !== 9 && ws !== 10 && ws !== 13)
        break;
    }

    if (value.charCodeAt(pos) !== 123) continue; // '{'

    const typeStart = pos + 1;
    try {
      const { type, endPos, paramOpt, paramRest } = parseTypePrefix(value, typeStart);
      if (value.charCodeAt(endPos) !== 125) continue; // '}'

      const closureExpr =
        (paramRest ? "..." : "") +
        type.toClosureExpr({ toParam: tag === "@param" && paramOpt });
      out += value.substring(last, typeStart) + closureExpr;
      last = endPos;
      i = endPos;
    } catch (e) {
      console.warn(
        "Cannot parse " + value.slice(typeStart, typeStart + 20) +
        "... in file " + fileName + ": " + e
      );
    }
  }
  return out + value.substring(last) + "*/";
};

export { transpileJsDoc };

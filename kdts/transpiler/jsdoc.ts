import { Comment } from "acorn";
import { parseTypePrefix } from "../types/parser";
import { Update } from "../util/textual";

const TAGS_WITH_TYPES = new Set([
  "@type",
  "@const",
  "@typedef",
  "@private",
  "@param",
  "@return",
  "@define",
]);

const transpileJsDoc = (comment: Comment, fileName: string): Update[] => {
  if (comment.type !== "Block")
    return [];

  const updates: Update[] = [];
  const value = comment.value;

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
      updates.push({
        beg: comment.start + 2 + typeStart,
        end: comment.start + 2 + endPos,
        put: closureExpr,
      });
      i = endPos;
    } catch (e) {
      console.warn(
        "Cannot parse " + value.slice(typeStart, typeStart + 20) +
        "... in file " + fileName + ": " + e
      );
    }
  }
  return updates;
};

export { transpileJsDoc };

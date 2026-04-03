/**
 * Removes one leading blank line, counts the leading spaces on the first
 * remaining line, then removes exactly that many characters from every line.
 *
 * This is intentionally strict so multiline source fixtures preserve spacing
 * bugs instead of hiding them. A line that is less indented than the first
 * line loses content rather than being handled leniently.
 *
 * Example:
 * stripIndent(`
 *   alpha
 *     beta
 * `) === "alpha\n  beta\n"
 */
const stripIndent = (text: string): string => {
  const start =
    text.startsWith("\r\n") ? 2 :
    text.startsWith("\n") ? 1 :
    0;

  let indent = 0;
  while (start + indent < text.length && text.charCodeAt(start + indent) == 32)
    ++indent;

  let out = "";
  let lineStart = start;
  for (let i = start; i <= text.length; ++i) {
    if (i != text.length && text.charCodeAt(i) != 10)
      continue;
    out += text.slice(lineStart + indent, i);
    if (i != text.length)
      out += "\n";
    lineStart = i + 1;
  }
  return out;
};

export { stripIndent };

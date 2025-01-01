import css from "css";

/**
 * @param {string} content css file content to be converted to a js enum
 * @return {string} js code that exports the enum
 */
const processCss = (content) => {
  const parsedCss = css.parse(content);
  /** @const {!Object<string, string>} */
  const exports = {};

  const rulesStack = [parsedCss.stylesheet.rules];
  for (let rules; rules = rulesStack.pop();) {
    let maybeExport;
    for (const rule of rules) {
      if (rule.type == "comment") {
        const matches = rule.comment.match(/@export\s*{(.*)}/);
        if (matches) maybeExport = matches[1].trim();
      } else if (rule.type == "rule") {
        if (maybeExport) {
          if (rule.selectors.length != 1 || rule.selectors[0].includes(" "))
            throw `Named or exported selectors must be singletons. Violating rule: ${rule.position.content}`;
          exports[maybeExport] = rule.selectors[0].slice(1);
        }
        maybeExport = null;
      } else if (rule.type == "media" || rule.type == "supports") {
        if (maybeExport)
          throw "Only singleton selectors may be named.";
        rulesStack.push(rule.rules);
      }
    }
  }
  /** @type {string} */
  let output = "\n/** @enum {string} */\nconst Style = {\n";
  for (const name in exports)
    output += `  ${name}: "${exports[name]}",\n`;
  return output + "};\n\nexport default Style;\n";
};

export { processCss };

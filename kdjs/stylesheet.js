import css from "css";

/**
 * @param {string} content css file content to be converted to a js enum
 * @return {string} js code that exports the enum
 */
const processCss = (content) => {
  /** @const {!css.Stylesheet} */
  const parsedCss = css.parse(content);
  /** @const {!Object<string, string>} */
  const exports = {};

  /** @const {!Array<!Array<!css.Rule|!css.Comment|!css.Media>>} */
  const nodesStack = [parsedCss.stylesheet.rules];
  for (let nodes; nodes = nodesStack.pop();) {
    /** @type {?string} */
    let maybeExport;
    for (const node of nodes) {
      if (node.type == "comment") {
        const matches = /** @type {!css.Comment} */(node).comment.match(/@export\s*{(.*)}/);
        if (matches) maybeExport = matches[1].trim();
      } else if (node.type == "rule") {
        /** @const {!css.Rule} */
        const rule = /** @type {!css.Rule} */(node);
        if (maybeExport) {
          if (rule.selectors.length != 1 || rule.selectors[0].includes(" "))
            throw `Named or exported selectors must be singletons. Violating rule: ${rule.position.content}`;
          exports[maybeExport] = rule.selectors[0].slice(1);
        }
        maybeExport = null;
      } else if (node.type == "media") {
        if (maybeExport)
          throw "Only singleton selectors may be named.";
        nodesStack.push(/** @type {!css.Media} */(node).rules);
      }
    }
  }
  /** @const {!Array<string>} */
  const names = Object.keys(exports).sort();
  /** @type {string} */
  let output = "\n/** @enum {string} */\nconst Style = {\n";
  for (const name of names)
    output += `  ${name}: "${exports[name]}",\n`;
  return output + "};\n\nexport default Style;\n";
};

export { processCss };

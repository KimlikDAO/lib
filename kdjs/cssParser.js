import css from "css";
import { DomIdMapper } from "./domIdMapper";
import { Update, update } from "./textual";

/**
 * @typedef {{
 *   default: !Object<string, string>
 * }}
 */
const CssModule = {};

/** @const {RegExp} */
const SimpleSelector = /^[#.][a-zA-Z0-9_-]+$/;

/**
 * Converts a css selector to a PascalCase enum key.
 *
 * @param {string} selector A css id or class selector including # or .
 * @return {string} PascalCase enum key.
 */
const selectorToEnumKey = (selector) => selector.slice(1)
  .split(/[-_]+/)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
  .join('');

/**
 * @param {string} file
 * @param {!css.BaseNode} node
 * @param {string} message
 * @return {string}
 */
const errorMessage = (file, node, message) =>
  `Error in ${file}:${node.position.start.line}:${node.position.start.column}: ${message}`;

/**
 * @param {string} file The name of the file
 * @param {string} content css file content to be converted to a js enum
 * @param {!DomIdMapper} domIdMapper
 * @return {string} js code that exports the enum
 */
const transpileCss = (file, content, domIdMapper) => {
  /** @const {!css.Stylesheet} */
  const parsedCss = css.parse(content);
  /** @const {!Object<string, string>} */
  const exports = {};
  /** @type {string} */
  let namespace = "mpa";

  /** @const {!Array<!Array<!css.Rule|!css.Comment|!css.Media>>} */
  const nodesStack = [parsedCss.stylesheet.rules];
  for (let nodes; nodes = nodesStack.pop();) {
    /** @type {?string} */
    let maybeExportAs = null;
    for (const node of nodes) {
      if (node.type == "comment") {
        const comment = /** @type {!css.Comment} */(node).comment;
        // Check for namespace declaration
        const nsMatch = comment.match(/@domNamespace\s*{(.*)}/);
        if (nsMatch) {
          if (Object.keys(exports).length > 0)
            throw errorMessage(file, node, "Namespace declaration must come before any exported selectors.");
          namespace = nsMatch[1].trim();
        }
        const exportMatch = comment.match(/@export(?:\s*{(.*)})?/);
        if (exportMatch)
          maybeExportAs = exportMatch[1] ? exportMatch[1].trim() : "";
      } else if (node.type == "rule") {
        /** @const {!css.Rule} */
        const rule = /** @type {!css.Rule} */(node);
        if (maybeExportAs !== null) {
          if (rule.selectors.length != 1)
            throw errorMessage(file, node, "Exported selectors must be singletons.");
          /** @const {string} */
          const selector = rule.selectors[0];

          if (!SimpleSelector.test(selector))
            throw errorMessage(file, node, "Exported selectors must be simple selectors.");
          maybeExportAs ||= selectorToEnumKey(selector);
          exports[maybeExportAs] = domIdMapper.map(namespace, file, selector.slice(1));
          maybeExportAs = null;
        }
      } else if (node.type == "media") {
        if (maybeExportAs !== null)
          throw errorMessage(file, node, "Media queries cannot be exported.");
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

/**
 * Minifies the css content, and returns the minified content and the mapping
 * from old selectors (converted to PascalCase) to the minified selectors.
 *
 * @param {string} file Path to the css file
 * @param {string} content css file content to be minified
 * @param {!DomIdMapper} domIdMapper
 * @return {{
 *   content: string,
 *   enumEntries: (!Object<string, string>)
 * }}
 */
const minifyCss = (file, content, domIdMapper) => {
  /** @const {!css.Stylesheet} */
  const parsedCss = css.parse(content);
  /** @const {!Array<Update>} */
  const updates = [];
  /** @const {!Object<string, string>} */
  const enumEntries = {};
  /** @type {string} */
  let namespace = "mpa";

  /** @const {!Array<!Array<!css.Rule|!css.Comment|!css.Media>>} */
  const nodesStack = [parsedCss.stylesheet.rules];
  for (let nodes; nodes = nodesStack.pop();) {
    for (const node of nodes) {
      if (node.type == "comment") {
        const comment = /** @type {!css.Comment} */(node).comment;
        const nsMatch = comment.match(/@domNamespace\s*{(.*)}/);
        if (nsMatch) {
          if (Object.keys(enumEntries).length > 0)
            throw errorMessage(file, node, "Namespace declaration must come before any selectors.");
          namespace = nsMatch[1].trim();
        }
      } else if (node.type == "rule") {
        /** @const {!css.Rule} */
        const rule = /** @type {!css.Rule} */(node);
        console.log(rule.selectors.slice(10000), namespace.slice(10000));
      } else if (node.type == "media")
        nodesStack.push(/** @type {!css.Media} */(node).rules);
    }
  }
  return { content: update(content, updates), enumEntries };
};

export { CssModule, minifyCss, transpileCss };

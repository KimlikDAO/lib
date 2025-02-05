import * as csstree from "css-tree";
import { splitFullExt } from "../util/paths";
import { DomIdMapper } from "./domIdMapper";

/**
 * @typedef {{
 *   default: !Object<string, string>
 * }}
 */
const CssModule = {};

/** @const {!RegExp} */
const ExportAsPattern = /@export\s*{(.*)}/;
/** @const {!RegExp} */
const DomNamespacePattern = /@domNamespace\s*{(.*)}/;

/**
 * Converts a css selector to a valid JS identifier.
 * If the selector has no separators, keeps it as is.
 * Otherwise converts to PascalCase.
 *
 * @param {string} selector A css id or class selector including # or .
 * @return {string} The JS identifier
 */
const selectorToEnumKey = (selector) => {
  const parts = selector.split(/[-_]+/);
  return parts.length === 1
    ? selector
    : parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("");
};

/**
 * @param {string} file
 * @param {!csstree.Node} node
 * @param {string} message
 * @return {string}
 */
const errorMessage = (file, node, message) => `Error in ${file}:${node.loc}: ${message}`;

/**
 * @param {string} file The name of the file
 * @param {string} content css file content to be converted to a js enum
 * @param {!DomIdMapper} domIdMapper
 * @return {string}
 */
const getEnum = (file, content, domIdMapper) => {
  /** @const {string} */
  const context = `${splitFullExt(file)[0]}.jsx`;
  /** @const {!csstree.StyleSheet} */
  const ast = csstree.parse(content.replaceAll("/**", "/*!"));
  /** @const {!Object<string, string>} */
  const enumEntries = {};
  /** @type {string} */
  let namespace = "mpa";
  /** @const {!Array<?csstree.ListItem>} */
  const stack = [];

  for (
    let /** @type {?csstree.ListItem} */ current = ast.children.head;
    current;
    current = /** @type {?csstree.ListItem} */(current.next || stack.pop())
  ) {
    /** @const {!csstree.CssNode} */
    const node = current.data;

    if (node.type === "Comment") {
      const comment = /** @type {!csstree.Comment} */(node);
      const nsMatch = comment.value.match(DomNamespacePattern);
      if (nsMatch) {
        if (Object.keys(enumEntries).length > 0)
          throw errorMessage(file, node, "Namespace declaration must come before any selectors.");
        namespace = nsMatch[1].trim();
      }
    } else if (node.type === "Rule") {
      /** @type {?string} */
      let enumKey = null;
      /** @type {boolean} */
      let isPreserved = false;
      if (current.prev && current.prev.data.type === "Comment") {
        /** @const {string} */
        const comment = /** @type {!csstree.Comment} */(current.prev.data).value;
        const exportMatch = comment.match(ExportAsPattern);
        if (exportMatch)
          enumKey = exportMatch[1].trim();
        else if (comment.includes("@export"))
          enumKey = "";
        isPreserved = comment.includes("@preserve");
      }
      if (enumKey !== null) {
        /** @const {!csstree.Rule} */
        const rule = /** @type {!csstree.Rule} */(node);
        if (!rule.prelude || rule.prelude.type !== "SelectorList")
          throw errorMessage(file, node, "Invalid selector");

        /** @const {!csstree.SelectorList} */
        const selector = rule.prelude;
        /** @const {!csstree.Selector} */
        const simpleSelector = /** @type {!csstree.Selector} */(selector.children.head.data);

        if (selector.children.head !== selector.children.tail)
          throw errorMessage(file, node, "Only simple singleton selectors can be exported");

        /** @type {?string} */
        let baseSelector = null;
        for (let part = simpleSelector.children.head; part; part = part.next) {
          if (part.data.type === "ClassSelector" || part.data.type === "IdSelector") {
            if (baseSelector)
              throw errorMessage(file, node, "Only simple singleton selectors can be exported");
            baseSelector = part.data.name;
          } else if (part.data.type !== "PseudoClassSelector") {
            throw errorMessage(file, node, "Only simple singleton selectors can be exported");
          }
        }
        if (!baseSelector)
          throw errorMessage(file, node, "No valid selector found");

        /** @const {string} */
        const finalKey = enumKey || selectorToEnumKey(baseSelector);
        enumEntries[finalKey] = isPreserved
          ? domIdMapper.preserve(namespace, baseSelector)
          : domIdMapper.map(namespace, context, baseSelector);
      }
    } else if (node.type === "Atrule" && /** @type {!csstree.Atrule} */(node).name === "media")
      stack.push(/** @type {!csstree.Atrule} */(node).block.children.head);

  }
  const entries = Object.keys(enumEntries).sort();
  let output = "/** @enum {string} */({\n";
  for (const entry of entries)
    output += `  ${entry}: "${enumEntries[entry]}",\n`;
  output += "})";
  return output;
}

/**
 * @param {string} file The name of the file
 * @param {string} content css file content to be converted to a js enum
 * @param {!DomIdMapper} domIdMapper
 * @return {string} js code that exports the enum
 */
const transpileCss = (file, content, domIdMapper) => {
  return "\n/** @enum {string} */\nconst Style = "
    + getEnum(file, content, domIdMapper)
    + ";\n\nexport default Style;\n";
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
  /** @const {string} */
  const context = `${splitFullExt(file)[0]}.jsx`;
  /** @const {!csstree.StyleSheet} */
  const ast = csstree.parse(content.replaceAll("/**", "/*!"));
  /** @const {!Object<string, string>} */
  const enumEntries = {};
  /** @type {string} */
  let namespace = "mpa";
  /** @const {!Array<?csstree.ListItem>} */
  const stack = [];

  for (
    let /** ?csstree.ListItem */ current = ast.children.head;
    current;
    current = current.next || stack.pop()
  ) {
    /** @const {!csstree.CssNode} */
    const node = current.data;

    if (node.type === "Comment") {
      const comment = /** @type {!csstree.Comment} */(node);
      const nsMatch = comment.value.match(DomNamespacePattern);
      if (nsMatch) {
        if (Object.keys(enumEntries).length > 0)
          throw errorMessage(file, node, "Namespace declaration must come before any selectors.");
        namespace = nsMatch[1].trim();
      }
    } else if (node.type === "Rule") {
      /** @type {?string} */
      let enumKey;
      /** @type {boolean} */
      let isPreserved = false;
      if (current.prev && current.prev.data.type === "Comment") {
        /** @const {string} */
        const comment = /** @type {!csstree.Comment} */(current.prev.data).value;
        const exportMatch = comment.match(ExportAsPattern);
        if (exportMatch)
          enumKey = exportMatch[1].trim();
        isPreserved = comment.includes("@preserve");
      }

      /** @const {!csstree.Rule} */
      const rule = /** @type {!csstree.Rule} */(node);
      if (!rule.prelude || rule.prelude.type !== "SelectorList") {
        console.log("second", rule);
        throw errorMessage(file, node, "Invalid selector");
      }

      /** @const {!csstree.SelectorList} */
      const selectorList = rule.prelude;

      if (enumKey && selectorList.children.head !== selectorList.children.tail)
        throw errorMessage(file, node, "Only simple singleton selectors can be exported");

      for (let selector = selectorList.children.head; selector; selector = selector.next) {
        for (let part = selector.data.children.head; part; part = part.next) {
          if (part.data.type === "ClassSelector" || part.data.type === "IdSelector") {
            /** @const {string} */
            const originalSelector = part.data.name;
            /** @const {string} */
            const finalKey = enumKey || selectorToEnumKey(originalSelector);
            /** @const {string} */
            const mappedSelector = isPreserved
              ? domIdMapper.preserve(namespace, originalSelector)
              : domIdMapper.map(namespace, context, originalSelector);
            enumEntries[finalKey] = mappedSelector;
            part.data.name = mappedSelector;
          }
        }
      }
    } else if (node.type === "Atrule" && /** @type {!csstree.Atrule} */(node).name === "media")
      stack.push(/** @type {!csstree.Atrule} */(node).block.children.head);
  }
  return { content: csstree.generate(ast), enumEntries };
};

export default {
  getEnum,
  minifyCss,
  selectorToEnumKey,
  transpileCss
};

import * as csstree from "css-tree";
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
 * Converts a css selector to a PascalCase enum key.
 *
 * @param {string} selector A css id or class selector including # or .
 * @return {string} PascalCase enum key.
 */
const selectorToEnumKey = (selector) => selector
  .split(/[-_]+/)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
  .join('');

/**
 * @param {string} file
 * @param {!csstree.Node} node
 * @param {string} message
 * @return {string}
 */
const errorMessage = (file, node, message) =>
  `Error in ${file}:${node.loc.start.line}:${node.loc.start.column}: ${message}`;

/**
 * @param {string} file The name of the file
 * @param {string} content css file content to be converted to a js enum
 * @param {!DomIdMapper} domIdMapper
 * @return {string} js code that exports the enum
 */
const transpileCss = (file, content, domIdMapper) => {
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
      if (current.prev && current.prev.data.type === "Comment") {
        /** @const {string} */
        const comment = /** @type {!csstree.Comment} */(current.prev.data).value;
        const exportMatch = comment.match(ExportAsPattern);
        if (exportMatch)
          enumKey = exportMatch[1].trim();
        else if (comment.includes("@export"))
          enumKey = "";
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
        enumEntries[finalKey] = domIdMapper.map(namespace, file, baseSelector);
      }
    } else if (node.type === "Atrule" && /** @type {!csstree.Atrule} */(node).name === "media") {
      stack.push(current.next);
      current = /** @type {!csstree.Atrule} */(node).block.children.head;
    }
  }

  /** @const {!Array<string>} */
  const names = Object.keys(enumEntries).sort();
  /** @type {string} */
  let output = "\n/** @enum {string} */\nconst Style = {\n";
  for (const name of names)
    output += `  ${name}: "${enumEntries[name]}",\n`;
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
  /** @const {!csstree.StyleSheet} */
  const ast = csstree.parse(content.replaceAll("/**", "/*!"));
  /** @const {!Object<string, string>} */
  const enumEntries = {};
  /** @type {string} */
  let namespace = "mpa";
  /** @const {!Array<!csstree.ListItem>} */
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
      if (current.prev && current.prev.data.type === "Comment") {
        /** @const {string} */
        const comment = /** @type {!csstree.Comment} */(current.prev.data).value;
        const exportMatch = comment.match(ExportAsPattern);
        if (exportMatch)
          enumKey = exportMatch[1].trim();
      }

      /** @const {!csstree.Rule} */
      const rule = /** @type {!csstree.Rule} */(node);
      if (!rule.prelude || rule.prelude.type !== "SelectorList")
        throw errorMessage(file, node, "Invalid selector");

      /** @const {!csstree.SelectorList} */
      const selectorList = rule.prelude;

      if (enumKey && selectorList.children.head !== selectorList.children.tail)
        throw errorMessage(file, node, "Only simple singleton selectors can be exported");

      for (let selector = selectorList.children.head; selector; selector = selector.next) {
        for (let part = selector.data.children.head; part; part = part.next) {
          if (part.data.type === "ClassSelector" || part.data.type === "IdSelector") {
            /** @const {string} */
            const originalName = part.data.name;
            /** @const {string} */
            const mappedName = domIdMapper.map(namespace, file, originalName);
            /** @const {string} */
            const finalKey = enumKey || selectorToEnumKey(originalName);
            enumEntries[finalKey] = mappedName;
            part.data.name = mappedName;
          }
        }
      }
    }
  }
  return { content: csstree.generate(ast), enumEntries };
};

export { CssModule, minifyCss, transpileCss };

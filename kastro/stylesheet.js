import { keccak256Uint8 } from "../crypto/sha3";
import { minifyCss } from "../kdjs/cssParser";
import { tagYaz } from "../util/html";
import { fileFromError } from "../util/reflection";
import compiler from "./compiler/compiler";
import hash from "./compiler/hash";
import { getDomIdMapper } from "./compiler/pageGlobals";

/** @const {!TextEncoder} */
const Encoder = new TextEncoder();

/**
 * @typedef {{
 *   function({ BuildMode: compiler.BuildMode }): Promise<string>
 * }}
 */
const StyleSheetCollection = {};

/**
 * @param {string} name Name of the collection
 * @return {!StyleSheetCollection}
 */
const makeStyleSheetCollection = (name) => {
  /** @const {!Map<string, Target>} */
  const targets = new Map();

  const CssCollection = Object.assign(
    ({ BuildMode }) => compiler.bundleTarget(name, {
      BuildMode,
      childTargets: Array.from(targets.values())
    }).then(
      (bundleName) => tagYaz("link", { rel: "stylesheet", href: bundleName }, true)
    ), {
    /**
     * @param {{ targetName: string, content: string }} target
     */
    add({ targetName, content: contentString }) {
      /** @const {!Uint8Array} */
      const content = Encoder.encode(contentString);
      /** @const {!ContentHash} */
      const contentHash = keccak256Uint8(content);
      /** @const {string} */
      const key = targetName.endsWith(".jsx")
        ? targetName.replace(".jsx", `-${hash.toStr(contentHash)}.css`)
        : targetName;
      targets.set(key, { targetName, content, contentHash });
    },

    removeAll(entries) {
      for (const [key] of entries)
        targets.delete(key);
    },

    addAll(entries) {
      for (const [key, target] of entries)
        targets.set(key, target);
    },

    entries() { return targets.entries(); }
  });

  return CssCollection;
}

/**
 * @typedef {{
 *   function({
 *     src: string,
 *     shared: boolean,
 *     SharedCss: StyleSheetCollection,
 *     PageCss: StyleSheetCollection,
 *   }): null
 * }}
 */
const StyleSheet = {};

/**
 * @param {string} fileName
 * @param {string} cssContent
 * @return {StyleSheet}
 */
const makeStyleSheet = (fileName, cssContent) => {
  const { content, enumEntries } = minifyCss(fileName, cssContent, getDomIdMapper());
  const Css = new Proxy(Object.assign(
    ({ SharedCss, PageCss, shared }) => {
      (shared ? SharedCss : PageCss).add({
        targetName: "/" + fileName,
        content
      });
      return null;
    },
    enumEntries
  ), {
    get(target, prop) {
      if (!(prop in target))
        console.warn(`StyleSheet: ${prop} is not defined in ${fileName}`);
      return target[prop];
    }
  });
  return Css;
};

/**
 * Returns a kastro StyleSheet component from a template literal.
 * The context passed to the `domIdMapper` is the filename with a .jsx
 * extension. For instance:
 *
 *   Filename             Context
 *   -----------------    -------------
 *   Component.css.jsx -> Component.jsx
 *   Component.jsx     -> Component.jsx
 *   Component.css     -> Component.jsx
 *
 * This way, files associated with a component are grouped together and can
 * attach new styles to the same selectors with ease.
 *
 * @param {!Array<string>} strings
 * @param {...string} values
 * @return {StyleSheet}
 */
const css = (strings, ...values) => {
  /** @type {string} */
  let cssContent = strings[0];
  for (let i = 1; i < strings.length; ++i)
    cssContent += (values[i - 1] || "") + strings[i];
  return makeStyleSheet(fileFromError(new Error(), 2), cssContent);
};

export {
  css,
  makeStyleSheet,
  makeStyleSheetCollection,
  StyleSheet,
  StyleSheetCollection
};

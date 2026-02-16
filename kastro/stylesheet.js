import { keccak256Uint8 } from "../crypto/sha3";
import { tagYaz } from "../util/html";
import { fileFromError } from "../util/reflection";
import compiler from "./compiler/compiler";
import hash from "./compiler/hash";
import { minifyCss } from "./transpiler/transpiler";

/** @const {TextEncoder} */
const Encoder = new TextEncoder();

class StyleSheetCollection {
  targets = new Map();
  /**
   * @param {{ targetName: string, content: string }} target
   */
  add({ targetName, content: contentString }) {
    /** @const {Uint8Array} */
    const content = Encoder.encode(contentString);
    /** @const {ContentHash} */
    const contentHash = keccak256Uint8(content);
    /** @const {string} */
    const key = targetName.endsWith(".jsx")
      ? targetName.replace(".jsx", `-${hash.toStr(contentHash)}.css`)
      : targetName;
    this.targets.set(key, { targetName, content, contentHash });
  }

  removeAll(entries) {
    for (const [key] of entries)
      this.targets.delete(key);
  }

  addAll(entries) {
    for (const [key, target] of entries)
      this.targets.set(key, target);
  }

  asTargets() {
    return Array.from(this.targets.values());
  }

  entries() { return this.targets.entries(); }

  clear() { this.targets.clear(); }
}

/** @type {StyleSheetCollection} */
let SharedCss = new StyleSheetCollection();
/** @type {StyleSheetCollection} */
let PageCss = new StyleSheetCollection();

const makeStyleSheets = () => {
  const dev = (BuildMode) => BuildMode == 0 ? "-dev" : "";
  PageCss.clear();

  const StyleSheets = ({ BuildMode, Lang, targetDir }) => {
    PageCss.removeAll(SharedCss.entries());
    return Promise.all([
      compiler.bundleTarget(`/build/shared-${Lang}${dev(BuildMode)}.css`, {
        BuildMode,
        childTargets: SharedCss.asTargets()
      }),
      compiler.bundleTarget(`${targetDir}/page-${Lang}${dev(BuildMode)}.css`, {
        BuildMode,
        childTargets: PageCss.asTargets()
      })
    ]).then(([sharedBundleName, pageBundleName]) =>
      tagYaz("link", { rel: "stylesheet", href: sharedBundleName }, true) +
      tagYaz("link", { rel: "stylesheet", href: pageBundleName }, true)
    );
  }

  return StyleSheets;
}

/**
 * @typedef {{
 *   function({
 *     src: string,
 *     shared: boolean,
 *   }): null
 * }}
 */
const StyleSheet = {};

const addStyleSheet = (shared, target) => (shared ? SharedCss : PageCss).add(target);

/**
 * @param {string} fileName
 * @param {string} cssContent
 * @return {StyleSheet}
 */
const makeStyleSheet = (fileName, cssContent) => {
  console.log("Making stylesheet for", fileName);
  const { content, enumEntries } = minifyCss(cssContent, fileName);
  const Css = new Proxy(Object.assign(
    ({ shared }) => {
      addStyleSheet(shared, {
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
 * @param {string[]} strings
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
  addStyleSheet,
  css,
  makeStyleSheet,
  makeStyleSheets,
  StyleSheet
};

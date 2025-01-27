import { getDomIdMapper } from "./compiler/pageGlobals";
import { minifyCss } from "../kdjs/cssParser";

const StyleSheet = ({ src, shared, SharedCss, PageCss }) => {
  (shared ? SharedCss : PageCss).add(src.startsWith("/") ? src : "/" + src);
  return;
}

/**
 * @param {string} filePath
 * @param {string} cssContent
 * @return {typeof StyleSheet}
 */
const makeStyleSheet = (filePath, cssContent) => {
  const { content, enumEntries } = minifyCss(filePath, cssContent, getDomIdMapper());
  const Style = Object.assign(({ SharedCss, PageCss, shared }) => {
    (shared ? SharedCss : PageCss).add({
      targetName: "/" + filePath,
      content
    });
    return null;
  }, enumEntries);
  return Style;
};

/**
 * Returns a kastro StyleSheet component from a template string.
 *
 * @param {!Array<string>} strings
 * @param {...string} values
 * @return {typeof StyleSheet}
 */
const css = (strings, ...values) => "";

export { css, StyleSheet, makeStyleSheet };

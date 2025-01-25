import { getDomIdMapper } from "./compiler/pageGlobals";
import { minifyCss } from "../kdjs/cssParser";

const StyleSheet = ({ src, shared, SharedCss, PageCss }) => {
  (shared ? SharedCss : PageCss).add(src.startsWith("/") ? src : "/" + src);
  return;
}

/**
 * @param {string} cssContent
 * @param {string=} filePath
 * @return {typeof StyleSheet}
 */
const makeStyleSheet = (cssContent, filePath) => {
  const { content, idMap } = minifyCss(cssContent, getDomIdMapper());
  const Style = Object.assign(({ SharedCss, PageCss, shared }) => {
    (shared ? SharedCss : PageCss).add({
      targetName: "/" + filePath,
      content
    });
    return null;
  }, idMap);
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

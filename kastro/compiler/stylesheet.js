import { minify } from "csso";
import { readFile } from "node:fs/promises";
import { hashAndCompressContent } from "./hashcache/compression";

const getStyleSheet = ({ PageCss, SharedCss, BuildMode }) => {
  const allCss = PageCss.union(SharedCss);
  if (BuildMode == 0) {
    let embeddedCss = "";
    let externalCss = "";
    for (const css of allCss)
      if (typeof css === "string")
        externalCss += `<link href="${css}" rel="stylesheet" type="text/css" />\n`;
      else
        embeddedCss += css.contents;
    return `<style>${embeddedCss}</style>${externalCss}`;
  }
  return Promise.all(allCss.map((css) => typeof css === "string"
    ? readFile(css, "utf8") : css.contents))
    .then((csses) => hashAndCompressContent(minify(csses.join("\n")).css, "css"))
    .then((hashedName) => `<link rel="stylesheet" src=${hashedName} type="text/css">`);
}

const StyleSheet = ({ src, shared, SharedCss, PageCss }) => {
  (shared ? SharedCss : PageCss).add(src);
  return;
}

export { getStyleSheet, StyleSheet };

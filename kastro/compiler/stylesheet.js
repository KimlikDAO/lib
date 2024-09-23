import { minify } from "csso";
import { mkdir, writeFile } from "node:fs/promises";
import { getDir } from "../../util/paths";
import { getFile, getTargetHash } from "./hashcache/buildCache";
import { compressToHash } from "./hashcache/compression";

/**
 * @param {!Set<string>} css
 * @return {!Promise<string>}
 */
const getStyleSheet = (target, css) => {
  const stringDeps = [];
  const fileDeps = [];
  for (const dep of css)
    if (typeof dep === "string")
      fileDeps.push(dep);
    else {
      stringDeps.push(dep.contents);
      delete dep.contents;
    }

  stringDeps.sort();
  fileDeps.sort();
  return getTargetHash(target, fileDeps, stringDeps, (target, fileDeps, stringDeps) =>
    Promise.all(fileDeps.map(getFile))
      .then((fileContents) => {
        const cssContent = minify(stringDeps.join("\n") + "\n" + fileContents.join("\n")).css;
        return mkdir(getDir(target), { recursive: true })
          .then(() => writeFile(target, cssContent))
          .then(() => cssContent);
      })
  )
    .then((hash) => compressToHash(target, hash))
    .then((hashedName) => `<link href="${hashedName}" rel="stylesheet" type="text/css">`);
}

const getStyleSheets = (componentName, { PageCss, SharedCss, BuildMode, Lang }) => {
  if (BuildMode == 0) {
    const allCss = PageCss.union(SharedCss);
    let embeddedCss = "";
    let externalCss = "";
    for (const css of allCss)
      if (typeof css === "string")
        externalCss += `<link href="${css}" rel="stylesheet" type="text/css" />\n`;
      else {
        embeddedCss += css.contents;
        delete css.contents;
      }
    return Promise.resolve(`<style>${embeddedCss}</style>${externalCss}`);
  }
  PageCss = PageCss.difference(SharedCss);
  return Promise.all([
    getStyleSheet(`build/${componentName}/shared-${Lang}.css`, SharedCss),
    getStyleSheet(`build/${componentName}/page-${Lang}.css`, PageCss),
  ]).then((sheets) => sheets.join(""));
}

export { getStyleSheet, getStyleSheets };

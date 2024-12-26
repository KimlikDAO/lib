import { minify } from "html-minifier";
import { compileComponent } from "./component";
import HtmlMinifierConfig from "./config/htmlMinifierConfig";
import { initGlobals } from "./pageGlobals";

const getStyleSheets = (targetName, { PageCss, SharedCss, BuildMode, Lang }) => {
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
  const componentName = getDir(targetName);
  return Promise.all([
    compiler.bundleTarget(`/build${componentName}/shared-${Lang}.css`, {
      BuildMode,
      childTargets: []
    }).then((bundleName) => `<link href="${bundleName}" rel="stylesheet" type="text/css">`),
    compiler.bundleTarget(`/build${componentName}/page-${Lang}.css`, {
      BuildMode,
      childTargets: []
    }).then((bundleName) => `<link href="${bundleName}" rel="stylesheet" type="text/css">`)
  ]).then(([sharedCss, pageCss]) => `${sharedCss}${pageCss}`);
}

/**
 * @param {string} targetName
 * @param {Props} props
 * @return {!Promise<string>}
 */
const pageTarget = (targetName, props) => {
  props.SharedCss = new Set();
  props.PageCss = new Set();
  initGlobals(props);
  return compileComponent("ana", {}, props)
    .then((html) => getStyleSheets(targetName, props).then((styleSheets) => {
      html = "<!DOCTYPE html>" + html.replace("</head>", styleSheets + "</head>");
      return props.BuildMode == 0
        ? html : minify(html, HtmlMinifierConfig);
    }));
}

export { pageTarget };

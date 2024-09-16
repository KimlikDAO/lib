import { plugin } from "bun";
import { minify } from "html-minifier";
import process from "node:process";
import { compileComponent } from "./component";
import HtmlMinifierConfig from "./htmlMinifierConfig";
import { initGlobals } from "./pageGlobals";
import { getStyleSheet } from "./stylesheet";

const setupEnvironment = () => {
  const KastroPlugin = {
    name: 'kastro loader',
    setup(build) {
      const cwdLen = process.cwd().length + 1;
      build.onLoad({ filter: /\.(svg|png|webp)$/ }, (args) => {
        const code = `import { Image } from "@kimlikdao/lib/kastro/compiler/image";\n` +
          `export default (props) => Image({...props, src: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const code = `import { StyleSheet } from "@kimlikdao/lib/kastro/compiler/stylesheet";\n` +
          `export default (props) => StyleSheet({...props, src: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
    },
  };

  plugin(KastroPlugin);

  globalThis.GEN = true;
  globalThis.document = {};
  globalThis.document.createElement = (name) => ({
    name
  });
}

setupEnvironment();

/**
 * @param {string} componentName
 * @param {!Object<string, *>} pageGlobals
 * @return {!Promise<string>}
 */
const compilePage = async (componentName, pageGlobals) => {
  pageGlobals.SharedCss = new Set();
  pageGlobals.PageCss = new Set();
  pageGlobals.GEN = false;
  if (pageGlobals.Lang == pageGlobals.CodebaseLang)
    pageGlobals[pageGlobals.Lang.toUpperCase()] = true;
  initGlobals(pageGlobals);
  return compileComponent(componentName, {}, pageGlobals)
    .then((html) => {
      html = "<!DOCTYPE html>" +
        html.replace("</head>", getStyleSheet(pageGlobals) + "</head>");

      return pageGlobals.BuildMode == 0
        ? html : minify(html, HtmlMinifierConfig);
    });
}

export {
  compilePage
};

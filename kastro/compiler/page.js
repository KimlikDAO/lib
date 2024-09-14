import { plugin } from "bun";
import { minify } from "html-minifier";
import process from "node:process";
import { LangCode } from "../../util/i18n";
import { compileComponent } from "./component";

import HtmlMinifierConfig from "./htmlMinifierConfig";
import { initGlobals } from "./pageGlobals";
import { generateStylesheet } from "./targets";

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
  // TODO(KimlikDAO-bot): Remove when we have 3 languages
  pageGlobals.TR = pageGlobals.Lang == LangCode.TR;
  initGlobals(pageGlobals);
  return compileComponent(componentName, {}, pageGlobals)
    .then((html) => {
      html = "<!DOCTYPE html>" + html;
      if (pageGlobals.BuildMode == 0) {
        /** @type {string} */
        let links = "";
        /** @const {!Set<string>} */
        const allCss = pageGlobals.PageCss.union(pageGlobals.SharedCss);
        for (const css of allCss)
          links += `  <link href="${css}" rel="stylesheet" type="text/css" />\n`;
        return html.replace("</head>", links + "</head>");
      }
      return generateStylesheet([...pageGlobals.PageCss])
        .then((stylesheet) => minify(
          html.replace("</head>", stylesheet + "\n</head>"),
          HtmlMinifierConfig
        ));
    });
}


export {
  compilePage
};


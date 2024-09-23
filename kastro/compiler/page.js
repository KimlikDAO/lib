import { plugin } from "bun";
import { minify } from "html-minifier";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { combine, getDir } from "../../util/paths";
import { compileComponent } from "./component";
import HtmlMinifierConfig from "./htmlMinifierConfig";
import { initGlobals } from "./pageGlobals";
import { getStyleSheets } from "./stylesheet";

const setupEnvironment = () => {
  const KastroPlugin = {
    name: "kastro-js",
    async setup(build) {
      const cwdLen = process.cwd().length + 1;
      const moduleDir = getDir(import.meta.url.slice(6));
      const stylesheetLoader = await readFile("/" + combine(moduleDir, "./loader/stylesheetLoader.js"), "utf8");
      const scriptLoader = await readFile("/" + combine(moduleDir, "./loader/scriptLoader.js"), "utf8");

      build.onLoad({ filter: /\.(svg|png|webp)$/ }, (args) => {
        const code = `import { Image } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => Image({...props, src: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
      build.onLoad({ filter: /\.css$/ }, (args) => ({
        contents: stylesheetLoader.replace("SOURCE", args.path.slice(cwdLen)),
        loader: "js"
      }));
      build.onLoad({ filter: /\.ttf$/ }, (args) => {
        const code = `import { TtfFont } from "@kimlikdao/lib/kastro/font";\n` +
          `export default (props) => TtfFont({...props, href: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
      build.onResolve({ filter: /./, namespace: "kastro" }, ({ path, importer }) => ({
        path: path.startsWith(".") ? "/" + combine(getDir(importer.replace("kastro:", "")), path) : path,
        namespace: "kastro"
      }));
      build.onLoad({ filter: /.*/, namespace: "kastro" }, (args) => ({
        contents: scriptLoader.replace("SOURCE", args.path.slice(cwdLen)),
        loader: "js"
      }));
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
  initGlobals(pageGlobals);
  return compileComponent(componentName, {}, pageGlobals)
    .then((html) => getStyleSheets(componentName, pageGlobals).then((styleSheets) => {
      html = "<!DOCTYPE html>" + html.replace("</head>", styleSheets + "</head>");
      console.log(pageGlobals);
      return pageGlobals.BuildMode == 0
        ? html : minify(html, HtmlMinifierConfig);
    }));
}

export {
  compilePage
};

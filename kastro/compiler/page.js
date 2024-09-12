import { plugin } from "bun";
import { minify } from "html-minifier";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { optimize } from "svgo";
import { tagYaz } from "../../util/html";
import { getExt } from "../../util/paths";
import { getByKey } from "../hashcache/buildCache";
import { hashAndCompressContent, hashFile } from "../hashcache/compression";
import { compileComponent } from "./component";
import HtmlMinifierConfig from "./htmlMinifierConfig";
import { initGlobals } from "./pageGlobals";
import SvgoConfig from "./svgoConfig";
import SvgoInlineConfig from "./svgoInlineConfig";
import { generateStylesheet, webp } from "./targets";

const setupEnvironment = () => {
  const ImagePlugin = {
    name: 'kastro image loader',
    setup(build) {
      const cwdLen = process.cwd().length;
      build.onLoad({ filter: /\.svg$/ }, (args) => {
        const code = `import { Image } from "@kimlikdao/lib/kastro/compiler/image";\n` +
          `export default (props) => Image({...props, src: "${args.path.slice(cwdLen)}" });`;
        return {
          contents: code,
          loader: "js"
        };
      });
    },
  };

  plugin(ImagePlugin);

  globalThis.GEN = true;
  globalThis.document = {};
  globalThis.document.createElement = (name) => ({
    name
  });
}

setupEnvironment();

/**
 * @param {!Object<string, string>} attribs
 * @param {!Object<string, string>} options
 * @return {!Promise<string>}
 */
const generateImage = (attribs, options) => {
  const type = getExt(attribs.src);
  const fileName = normalizePath(attribs.src);
  delete attribs["src"];

  if ("data-inline" in attribs) {
    delete attribs["data-inline"];
    assert.equal(type, "svg", "We only support inlining svgs. For binary formats, not inlining is more efficient");
    return getByKey(fileName, () =>
      compileComponent(fileName, attribs)
        .then((svg) => optimize(svg, SvgoInlineConfig).data))
  }

  const generate = {
    "svg": () => (options.dev
      ? Promise.resolve(fileName)
      : getByKey(fileName, () => svgOku({ konum: fileName, dev: options.dev })
        .then((svg) => hashAndCompressContent(svg, "svg"))))
      .then((hashedName) => {
        attribs.src = hashedName;
        return tagYaz("img", attribs, true);
      }),
    "png": () => {
      const webpName = `build/${fileName.slice(0, -4)}.webp`;
      const { passes, quality, ...atts } = attribs;
      return (options.dev
        ? Promise.resolve(fileName)
        : getByKey(fileName,
          () => webp(fileName, webpName, passes, quality)
            .then(() => hashFile(webpName))))
        .then((hashedName) => {
          atts.src = hashedName;
          return tagYaz("img", atts, true);
        });
    }
  };
  return generate[type]();
}

/**
 * @param {string} componentName
 * @param {!Object<string, *>} pageGlobals
 * @return {!Promise<string>}
 */
const compilePage = async (componentName, pageGlobals) => {
  pageGlobals.SharedCss = new Set();
  pageGlobals.PageCss = new Set();
  initGlobals(pageGlobals);

  return compileComponent(componentName, {}, pageGlobals)
    .then((html) => {
      html = "<!DOCTYPE html>" + html;
      console.log(pageGlobals);
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

/**
 * Verilen konumdan svg içeriğini okur. Eğer uzantı .m.js ise içeriğini kasto
 * kurallarına göre günceller.
 *
 * Eğer `!seçimler.dev` is içeriği svgo ile optimize eder.
 *
 * @param {!Object<string, string>} seçimler
 * @return {!Promise<string>}
 */
const compileSvg = (seçimler) => (
  seçimler.konum.endsWith(".m.svg")
    ? compileComponent(seçimler.konum, seçimler)
    : readFile(seçimler.konum, "utf8"))
  .then((svg) => seçimler.dev ? svg : optimize(svg, SvgoConfig).data);

export {
  compilePage,
  compileSvg
};


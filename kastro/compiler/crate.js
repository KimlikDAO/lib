import { plugin } from "bun";
import process from "node:process";
import { LangCode } from "../../util/i18n";
import { combine, getDir } from "../../util/paths";
import bundle from "./bundle";
import { ttfTarget, woff2Target } from "./font";
import {
  inlineSvgTarget,
  jsxSvgTarget,
  pngTarget,
  svgTarget,
  webpTarget
} from "./image";
import { pageTarget } from "./page";
import { scriptTarget } from "./script";
import { styleSheetTarget } from "./styleSheet";
import { Target, registerTargetFunction } from "./target";

/**
 * @param {string} _targetName
 * @param {Props} props
 * @return {Promise<string | Uint8Array | null>}
 */
const crateTarget = async (_targetName, props) => {
  if (!props.dynamicDeps) throw "Crate targets need to be dynamicProps";
  const map = getPageTargets(props.data, props);
  console.log(map);
  const childTargets = Object.values(map);

  bundle.reset();
  if (await props.checkFreshFn(childTargets))
    return null;

  const aliases = props.data.Aliases || {};
  for (const key in aliases)
    await bundle.alias(key, aliases[key]);

  return JSON.stringify({
    hostUrl: props.data.HostUrl,
    ...bundle.getReport()
  });
}

/** 
 * Sets up Kastro compiler:
 *  - Registers `TargetFunction`'s for the compiler per extension.
 *  - Installs asset loaders.
 *  - Creates a minimal fake DOM (includes some injected providers)
 *  - Sets the global GEN flag, which makes `dom` module
 *    and Kastro components run in the generate mode.
 */
const setupKastro = () => {
  registerTargetFunction(".c.json", crateTarget);
  registerTargetFunction(".html", pageTarget);
  registerTargetFunction(".inl.svg", inlineSvgTarget);
  registerTargetFunction(".png", pngTarget);
  registerTargetFunction(".svg", svgTarget);
  registerTargetFunction(".jsx.svg", jsxSvgTarget);
  registerTargetFunction(".css", styleSheetTarget);
  registerTargetFunction(".webp", webpTarget);
  registerTargetFunction(".ttf", ttfTarget);
  registerTargetFunction(".woff2", woff2Target);
  registerTargetFunction(".js", scriptTarget);
  registerTargetFunction(".jsx", scriptTarget);

  plugin({
    name: "kastro-js",
    async setup(build) {
      const cwdLen = process.cwd().length + 1;
      const path = (args) => args.path.slice(cwdLen);

      build.onLoad({ filter: /\.(svg|png|webp)$/ }, (args) => {
        const code = `import Image from "@kimlikdao/lib/kastro/Image";\n` +
          `export default (props) => Image({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const code = `import { makeStyleSheet } from "@kimlikdao/lib/kastro/StyleSheet";\n` +
          `import { readFileSync } from "node:fs";\n` +
          `export default makeStyleSheet("${path(args)}", readFileSync("${path(args)}", "utf-8"));`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.ttf$/ }, (args) => {
        const code = `import Font from "@kimlikdao/lib/kastro/Font";\n` +
          `export default (props) => Font({...props, href: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onResolve({ filter: /./, namespace: "kastro" }, ({ path, importer }) => ({
        path: path.startsWith(".") ? "/" + combine(getDir(importer.replace("kastro:", "")), path) : path,
        namespace: "kastro"
      }));
      build.onLoad({ filter: /.svg.jsx$/, namespace: "kastro" }, (args) => {
        const code = `import { SvgJsxImage } from "@kimlikdao/lib/kastro/Image";\n` +
          `export default (props) => SvgJsxImage({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.(js|ts)$/, namespace: "kastro" }, (args) => {
        const code = `import { Worker } from "@kimlikdao/lib/kastro/Script";\n` +
          `export default (props) => Worker({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
    },
  });

  class SinkElement {
    constructor(name) {
      this.name = name;
    }
    get children() { return [this, this, this, this, this]; }
    get firstElementChild() { return this; }
    get nextSibling() { return this; }
    get parentElement() { return this; }
    get parentNode() { return this; }
    get previousElementSibling() { return this; }
    get previousSibling() { return this; }

    cloneNode(deep) { return this; }
    replaceChild(newChild, oldChild) { return this; }
    appendChild() { return this; }
    closest() { return this; }

    get classList() {
      return {
        add: () => { },
        remove: () => { },
        contains: () => false,
        toggle: () => false
      };
    }
    get style() {
      return new Proxy({}, {
        get: () => "",
        set: () => true
      });
    }
  }

  const window = {
    ethereum: {
      isRabby: false
    },
    location: {
      hash: "",
    },
    addEventListener(name, handler) { },
    dispatchEvent(event) { }
  };
  globalThis.GEN = true;
  globalThis.window = window;
  globalThis.document = {
    cookie: "",
    getElementById: (id) => {
      console.warn(`use typed dom.elem() methods instead! ${id}`);
      return new SinkElement("");
    },
  };
  globalThis.document.createElement = (name) => new SinkElement(name);

  /**
   * @template T
   * @this {T[]}
   * @param {(elem: T, index?: number) => void} lambda
   * @return {T[]}
   */
  Array.prototype.modify = function (lambda) {
    for (let i = 0, n = this.length; i < n; ++i)
      lambda(this[i], i);
    return this;
  };
}

/**
 * Infers `LangCode`s used in a crate.
 * @param {Object} crate
 * @return {LangCode[]}
 */
const getLanguages = (crate) => crate.Languages || Object.keys(Object.values(crate.Page)[0]);

/**
 * @param {Record<string, Target>} map
 * @param {Object} crate
 * @param {Props} props 
 * @return {Record<string, Target>} Returns a map from routes to page props.
 */
const addPageTargets = (map, { Page, CodebaseLang, Entry }, { BuildMode, Lang }) => {
  for (const name in Page) {
    const dirName = Entry == Page[name] ? name.toLowerCase() : Page[name][CodebaseLang];
    const pageProps = {
      BuildMode,
      Lang,
      CodebaseLang,
      Route: { ...Page[name] },
      bundleName: Page[name][Lang],
      targetName: `/build/${dirName}/${name}-${Lang}.html`,
      alwaysBuild: true,
    };
    delete pageProps.Route[Lang];
    map[`${pageProps.bundleName}`] = pageProps;
  }
};

/**
 * @param {Object} crate
 * @param {Props} props
 * @return {Record<string, Target>}
 */
const getPageTargets = (crate, { BuildMode, Lang }) => {
  const map = {};
  const langs = Lang ? [Lang] : getLanguages(crate);
  for (const lang of langs)
    addPageTargets(map, crate, { BuildMode, Lang: lang });
  return map;
}

export {
  getLanguages,
  getPageTargets,
  setupKastro
};

import { plugin } from "bun";
import process from "node:process";
import { LangCode } from "../../util/i18n";
import { combine, getDir } from "../../util/paths";
import compiler from "./compiler";
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
import { registerTargetFunction } from "./target";

/**
 * Sets up Kastro compiler:
 *  - Registers `TargetFunction`'s for the compiler per extension.
 *  - Installs asset loaders.
 *  - Creates a minimal fake DOM (includes some injected providers)
 *  - Sets the global GEN flag, which makes `dom` module
 *    and Kastro components run in the generate mode.
 */
const setupKastro = () => {
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
        const code = `import { Image } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => Image({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const code = `import { makeStyleSheet } from "@kimlikdao/lib/kastro/stylesheet";\n` +
          `import { readFileSync } from "node:fs";\n` +
          `export default makeStyleSheet("${path(args)}", readFileSync("${path(args)}", "utf-8"));`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.ttf$/ }, (args) => {
        const code = `import { TtfFont } from "@kimlikdao/lib/kastro/font";\n` +
          `export default (props) => TtfFont({...props, href: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onResolve({ filter: /./, namespace: "kastro" }, ({ path, importer }) => ({
        path: path.startsWith(".") ? "/" + combine(getDir(importer.replace("kastro:", "")), path) : path,
        namespace: "kastro"
      }));
      build.onLoad({ filter: /.svg.jsx$/, namespace: "kastro" }, (args) => {
        const code = `import { SvgJsxImage } from "@kimlikdao/lib/kastro/image";\n` +
          `export default (props) => SvgJsxImage({...props, src: "${path(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.(js|ts)$/, namespace: "kastro" }, (args) => {
        const code = `import { Worker } from "@kimlikdao/lib/kastro/script";\n` +
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
 * @param {Record<string, PageTarget>} map
 * @param {Object} crate
 * @param {compiler.BuildMode} buildMode
 * @param {LangCode} lang
 * @return {Record<string, PageTarget>} Returns a map from routes to page props.
 */
const addPageTargets = (map, { Page, CodebaseLang, Entry }, buildMode, lang) => {
  for (const name in Page) {
    const dirName = Entry == Page[name] ? name.toLowerCase() : Page[name][CodebaseLang];
    const pageProps = {
      BuildMode: buildMode,
      Lang: lang,
      CodebaseLang,
      Route: { ...Page[name] },
      bundleName: Page[name][lang],
      targetName: `/build/${dirName}/page-${lang}.html`,
      alwaysBuild: true,
    };
    delete pageProps.Route[lang];
    map[`${pageProps.bundleName}`] = pageProps;
  }
};

/** @const {TargetFunction} */
const crateTarget = (targetName, props) => { }

/**
 * @param {string} crateName
 * @param {compiler.BuildMode} buildMode
 * @param {LangCode | null} lang
 */
const buildCrate = async (crateName, buildMode, lang) => {
  const crate = await import(crateName);
  if (!lang) {
    // If no language is specified, spawn a bun instance for each language.
    // For now we do this sequentially since each page saturates the CPUs.
    const langs = crates.getLanguages(crate);
    for (const lang of langs) {
      console.info(`${Blue}[Building]${Clear} MPA ${lang}`);
      await spawn({
        cmd: ["bun", "lib/kastro/kastro.js", "build", "--lang", lang],
        env: { ...process.env, NODE_ENV: "production" },
        stdio: ["inherit", "inherit", "inherit"]
      }).exited;
    }
    if (crate.Aliases) {
      const tasks = [];
      for (const alias in crate.Aliases) {
        const exts = CompressedMimes[getExt(alias)] ? [""] : ["", ".br", ".gz"];
        for (const ext of exts)
          tasks.push(cp(`build/bundle/${crate.Aliases[alias]}${ext}`, `build/bundle/${alias}${ext}`));
      }
      await Promise.all(tasks);
    }
    return;
  }
  // If a language is specified, build each page for that language.
  setupKastro();
  /** @const {Record<string, PageTarget>} */
  const map = getPageTargets(crate, buildMode, lang);

  for (const page of Object.values(map))
    if (["mint", "en"].includes(page.bundleName)) {
      console.info(`${Blue}[Building]${Clear} Page ${page.bundleName}`);
      await compiler.bundleTarget(page.targetName, page);
    }
}

/**
 * @param {Object} crate
 * @param {compiler.BuildMode} buildMode
 * @param {LangCode=} lang
 * @return {Record<string, PageTarget>}
 */
const getPageTargets = (crate, buildMode, lang) => {
  const map = {};
  const langs = lang ? [lang] : getLanguages(crate);
  for (const lang of langs)
    addPageTargets(map, crate, buildMode, lang);
  return map;
}

export {
  getLanguages,
  getPageTargets,
  setupKastro
};

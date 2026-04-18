import { plugin, Transpiler } from "bun";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { LangCode } from "../../util/i18n";
import { combine, getDir } from "../../util/paths";
import { Props } from "../props";
import bundle from "./bundle";
import { ttfTarget, woff2Target } from "./font";
import {
  inlineSvgTarget,
  pngTarget,
  svgTarget,
  tsxSvgTarget,
  webpTarget
} from "./image";
import { pageTarget } from "./page";
import { scriptTarget } from "./script";
import { styleSheetTarget } from "./styleSheet";
import { registerTargetFunction } from "./target";

type Route = Record<LangCode, string>;

type PageTargetProps = Props & {
  BuildMode: number;
  Lang: LangCode;
  CodebaseLang: LangCode;
  Route: Partial<Route>;
  bundleName: string;
  targetName: string;
  alwaysBuild: true;
};

type Crate = {
  Aliases?: Record<string, string>;
  CodebaseLang: LangCode;
  Entry: Route;
  HostUrl?: string;
  Languages?: LangCode[];
  Page: Record<string, Route>;
};

type DynamicCrateProps = Props & {
  checkFreshFn: (deps: PageTargetProps[]) => Promise<boolean>;
  data: Crate;
  dynamicDeps: true;
};

type ResolveArgs = {
  importer: string;
  path: string;
};

type LoadArgs = {
  path: string;
};

type MockStyle = Record<string, string>;

type MockClassList = {
  add: (...tokens: string[]) => void;
  remove: (...tokens: string[]) => void;
  contains: (_token: string) => boolean;
  toggle: (_token: string, _force?: boolean) => boolean;
};

type MockWindow = {
  ethereum: {
    isRabby: boolean;
  };
  location: {
    hash: string;
  };
  addEventListener: (_name: string, _handler: unknown) => void;
  dispatchEvent: (_event: unknown) => void;
};

type MockDocument = {
  cookie: string;
  createElement: (name: string) => SinkElement;
  getElementById: (id: string) => SinkElement;
};

class SinkElement {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  get children(): this[] { return [this, this, this, this, this]; }
  get firstElementChild(): this { return this; }
  get nextSibling(): this { return this; }
  get parentElement(): this { return this; }
  get parentNode(): this { return this; }
  get previousElementSibling(): this { return this; }
  get previousSibling(): this { return this; }

  cloneNode(_deep?: boolean): this { return this; }
  replaceChild(_newChild: unknown, _oldChild: unknown): this { return this; }
  appendChild(..._children: unknown[]): this { return this; }
  closest(..._selectors: unknown[]): this { return this; }

  get classList(): MockClassList {
    return {
      add: () => { },
      remove: () => { },
      contains: () => false,
      toggle: () => false
    };
  }

  get style(): MockStyle {
    return new Proxy({}, {
      get: () => "",
      set: () => true
    });
  }
}

const crateTarget = async (
  _targetName: string,
  props: DynamicCrateProps
): Promise<string | null> => {
  const map = getPageTargets(props.data, props);
  console.log(map);
  const childTargets = Object.values(map);

  bundle.reset();
  if (await props.checkFreshFn(childTargets))
    return null;

  const aliases = props.data.Aliases || {};
  for (const key in aliases)
    await bundle.alias(key, aliases[key]!);

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
const setupKastro = (): void => {
  registerTargetFunction(".c.json", crateTarget as any);
  registerTargetFunction(".html", pageTarget);
  registerTargetFunction(".inl.svg", inlineSvgTarget);
  registerTargetFunction(".png", pngTarget);
  registerTargetFunction(".svg", svgTarget);
  registerTargetFunction(".tsx.svg", tsxSvgTarget);
  registerTargetFunction(".css", styleSheetTarget);
  registerTargetFunction(".webp", webpTarget);
  registerTargetFunction(".ttf", ttfTarget);
  registerTargetFunction(".woff2", woff2Target);
  registerTargetFunction(".js", scriptTarget);
  registerTargetFunction(".jsx", scriptTarget);

  plugin({
    name: "kastro",
    async setup(build: any) {
      const tsconfig = {
        compilerOptions: {
          jsxImportSource: "@kimlikdao/kastro/transpiler",
        },
      };
      const tsxTranspiler = new Transpiler({
        loader: "tsx",
        autoImportJSX: true,
        tsconfig,
        trimUnusedImports: true,
      });
      const cwdLen = process.cwd().length + 1;
      const rel = (args: LoadArgs): string => args.path.slice(cwdLen);
      const resolvePath = (importer: string, path: string): string => {
        const colonIndex = importer.indexOf(":");
        if (colonIndex != -1) importer = importer.slice(colonIndex + 1);
        return "/" + combine(getDir(importer), path);
      };
      build.onResolve({ filter: /./, namespace: "kastro" }, ({ importer, path }: ResolveArgs) => {
        if (!(path.startsWith(".") || path.startsWith("/")))
          return;
        return { namespace: "kastro", path: resolvePath(importer, path) };
      });
      build.onResolve({ filter: /\.svg$/ }, ({ importer, path }: ResolveArgs) => {
        if (!(path.startsWith(".") || path.startsWith("/")))
          return;
        const svgTsxPath = resolvePath(importer, path) + ".tsx";
        if (!existsSync(svgTsxPath)) return;
        return { path: svgTsxPath };
      });
      build.onLoad({ filter: /\.svg\.tsx$/ }, (args: LoadArgs) => {
        const code = `import { SvgTsxImage } from "@kimlikdao/kastro/Image";\n` +
          `export default (props) => SvgTsxImage({...props, src: "${rel(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.(t|j)sx$/ }, (args: LoadArgs) => {
        const contents = tsxTranspiler.transformSync(readFileSync(rel(args), "utf8"));
        return { contents, loader: "js" };
      });
      build.onLoad({ filter: /\.(svg|png|webp)$/ }, (args: LoadArgs) => {
        const code = `import Image from "@kimlikdao/kastro/Image";\n` +
          `export default (props) => Image({...props, src: "${rel(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.css$/ }, (args: LoadArgs) => {
        const code = `import { makeStyleSheet } from "@kimlikdao/kastro/StyleSheet";\n` +
          `import { readFileSync } from "node:fs";\n` +
          `export default makeStyleSheet("${rel(args)}", readFileSync("${rel(args)}", "utf-8"));`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.ttf$/ }, (args: LoadArgs) => {
        const code = `import Font from "@kimlikdao/kastro/Font";\n` +
          `export default (props) => Font({...props, href: "${rel(args)}" });`;
        return { contents: code, loader: "js" };
      });
      build.onLoad({ filter: /\.(js|ts)$/, namespace: "kastro" }, (args: LoadArgs) => {
        const code = `import { Worker } from "@kimlikdao/kastro/Script";\n` +
          `export default (props) => Worker({...props, src: "${rel(args)}" });`;
        return { contents: code, loader: "js" };
      });
    },
  });

  const window: MockWindow = {
    ethereum: {
      isRabby: false
    },
    location: {
      hash: "",
    },
    addEventListener() { },
    dispatchEvent() { }
  };

  const globals = globalThis as unknown as {
    GEN?: boolean;
    document?: MockDocument;
    window?: MockWindow;
  };

  globals.GEN = true;
  globals.window = window;
  globals.document = {
    cookie: "",
    getElementById: (id: string) => {
      console.warn(`use typed dom.elem() methods instead! ${id}`);
      return new SinkElement("");
    },
    createElement: (name: string) => new SinkElement(name),
  };
}

const getLanguages = (crate: Crate): LangCode[] =>
  crate.Languages || Object.keys(Object.values(crate.Page)[0]!) as LangCode[];

const addPageTargets = (
  map: Record<string, PageTargetProps>,
  { Page, CodebaseLang, Entry }: Crate,
  { BuildMode, Lang }: { BuildMode: number; Lang: LangCode }
): void => {
  for (const name in Page) {
    const dirName = Entry == Page[name]
      ? name.toLowerCase()
      : Page[name]![CodebaseLang];
    const pageProps: PageTargetProps = {
      BuildMode,
      Lang,
      CodebaseLang,
      Route: { ...Page[name]! },
      bundleName: Page[name]![Lang],
      targetName: `/build/${dirName}/${name}-${Lang}.html`,
      alwaysBuild: true,
    };
    delete pageProps.Route[Lang];
    map[pageProps.bundleName] = pageProps;
  }
};

const getPageTargets = (
  crate: Crate,
  { BuildMode = 0, Lang }: Pick<Props, "BuildMode" | "Lang">
): Record<string, PageTargetProps> => {
  const map: Record<string, PageTargetProps> = {};
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

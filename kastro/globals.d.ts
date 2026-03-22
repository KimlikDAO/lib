// Kastro components are dual-purpose: at generation time they may behave like
// html producers, while at mount time stateful components may be used as
// constructors. Model the result as an opaque top type instead of Promise<string>.
type KastroComponentResult = any;

type KastroLangCode = "en" | "tr";

interface KastroAssetProps {
  BuildMode?: number;
  Lang?: KastroLangCode;
  [key: string]: unknown;
}

interface KastroSvgProps extends KastroAssetProps {
  alt?: string;
  bundleHeight?: number;
  bundleName?: string;
  bundleWidth?: number;
  childTargets?: unknown[];
  height?: number | string;
  href?: string;
  inline?: boolean;
  piggyback?: string;
  raster?: number;
  rel?: string;
  src?: string;
  width?: number | string;
}

interface KastroFontProps extends KastroAssetProps {
  href?: string;
  name?: string;
  shared?: boolean;
  weight?: number;
}

interface KastroStyleSheetProps extends KastroAssetProps {
  shared?: boolean;
}

type KastroStyleSheetComponent =
  (props?: KastroStyleSheetProps) => KastroComponentResult;

// CSS modules are typed via generated sibling `*.d.css.ts` files.

declare module "*.svg" {
  const SvgComponent: (props?: KastroSvgProps) => KastroComponentResult;
  export default SvgComponent;
}

declare module "*.ttf" {
  const FontComponent: (props?: KastroFontProps) => KastroComponentResult;
  export default FontComponent;
}

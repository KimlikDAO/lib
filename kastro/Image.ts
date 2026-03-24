import { SAXParser } from "sax";
import { htmlTag } from "../util/markup/html";
import { getExt } from "../util/paths";
import compiler from "./compiler/compiler";
import { removeGlobalProps } from "./props";

interface ChildTargetRef {
  targetName: string;
  [key: string]: unknown;
}

interface BuiltTarget {
  content: Uint8Array;
  targetName?: string;
}

interface HtmlProps {
  [key: string]: string | number | boolean | null | undefined;
}

interface ImageProps {
  [key: string]: unknown;
  BuildMode?: number;
  bundleHeight?: number;
  bundleName?: string;
  bundleWidth?: number;
  childTargets?: Array<string | ChildTargetRef>;
  href?: string;
  inSvg?: boolean;
  inline?: boolean;
  passes?: number;
  piggyback?: string;
  quality?: number;
  raster?: number;
  rel?: string;
  src: string;
  width?: number | string;
}

const Decoder = new TextDecoder();

const asHtmlProps = (props: Record<string, unknown>): HtmlProps =>
  props as HtmlProps;

/** Serializes either an HTML `<img>` or an SVG `<image>` once the bundle name is known. */
const makeImageElement = (
  bundleName: string,
  { inSvg, piggyback, childTargets, ...props }: ImageProps
): string => {
  removeGlobalProps(props);
  if (piggyback)
    bundleName = piggyback + bundleName;
  if (inSvg) {
    props.href = bundleName;
    delete props.src;
  } else {
    props.src = bundleName;
    delete props.href;
  }
  return htmlTag(inSvg ? "image" : "img", asHtmlProps(props), true);
}

/** Maps a source asset path to the generated target path used by the compiler. */
const makeTargetName = (parentTarget: string, suffix: string): string => {
  const lastSlash = parentTarget.lastIndexOf("/");
  parentTarget = parentTarget.slice(0, parentTarget.indexOf(".", lastSlash));
  return parentTarget.startsWith("build")
    ? `/${parentTarget}${suffix}`
    : `/build/${parentTarget}${suffix}`;
}

/** Inlines an optimized SVG and merges caller props onto the root `<svg>` node. */
const InlineSvgImage = ({
  src,
  childTargets,
  bundleWidth,
  bundleHeight,
  ...props
}: ImageProps): Promise<string> =>
  compiler.buildTarget(makeTargetName(src, ".inl.svg"), {
    childTargets: childTargets || [`/${src}`],
    ...props
  }).then(({ content }: BuiltTarget) => {
    removeGlobalProps(props);
    delete props.inline;
    delete props.piggyback;
    const parser = new SAXParser(true);
    let result = "";
    parser.onopentag = ({ name, attributes }) => {
      if (name == "svg")
        Object.assign(attributes, asHtmlProps(props));
      result += htmlTag(name, attributes, false);
    };
    parser.ontext = (text) => {
      result += text;
    };
    parser.onclosetag = (tagName) => {
      result += `</${tagName}>`;
    };
    parser.write(Decoder.decode(content)).close();
    return result;
  });

/** Builds an SVG asset bundle or inlines it directly when requested. */
const SvgImage = ({
  inline,
  BuildMode,
  bundleName,
  bundleWidth,
  bundleHeight,
  ...props
}: ImageProps): Promise<string> => {
  if (inline) return InlineSvgImage(props);
  return compiler.bundleTarget(
    makeTargetName(props.src, props.width ? `-w${props.width}.svg` : ".svg"),
    {
      BuildMode,
      bundleName,
      childTargets: props.childTargets || [`/${props.src}`]
    }
  ).then((computedBundleName: string) => makeImageElement(computedBundleName, props));
}

/** Treats a `.svg.tsx` file as an SVG-producing asset component before bundling it. */
const SvgTsxImage = ({ src, ...props }: ImageProps): Promise<string> => {
  const svgTarget = `/build/${src.slice(0, -8)}.tsx.svg`;
  const svgProps = {
    piggyback: props.piggyback,
    childTargets: [`/${src}`]
  };
  return compiler.buildTarget(svgTarget, svgProps)
    .then(() => SvgImage({
      src: svgTarget.slice(1),
      childTargets: [{ targetName: svgTarget, ...svgProps }],
      ...props
    }));
}

/** Converts a raster source into a bundled WebP and emits the final image tag. */
const PngImage = ({
  src,
  passes,
  quality,
  BuildMode,
  bundleWidth,
  bundleHeight,
  ...props
}: ImageProps): Promise<string> =>
  compiler.bundleTarget(`/build/${src.slice(0, -4)}.webp`, {
    BuildMode,
    passes,
    quality,
    bundleWidth,
    bundleHeight,
    childTargets: [`/${src}`]
  }).then((bundledName: string) => makeImageElement(bundledName, props));

/** Emits both SVG and raster favicon links from the same source asset. */
const Favicon = ({ src, raster, BuildMode, ...props }: ImageProps): Promise<string> => {
  removeGlobalProps(props);
  return Promise.all([
    compiler.bundleTarget(`/build/${src}`, {
      BuildMode,
      childTargets: [`/${src}`]
    }),
    compiler.bundleTarget(`/build/${src.slice(0, -4)}${raster}.png`, {
      BuildMode,
      raster,
      childTargets: [`/${src}`]
    })
  ]).then(([svgBundled, pngBundled]: [string, string]) =>
    htmlTag("link", { rel: "icon", href: svgBundled, type: "image/svg+xml" }, true) +
    htmlTag("link", { rel: "icon", href: pngBundled, type: "image/png", sizes: `${raster}x${raster}` }, true)
  )
};

/** Dispatches image sources to the correct Kastro image component. */
const Image = ({ inline, ...props }: ImageProps): Promise<string> => {
  if (inline && (props.src.endsWith(".svg") || props.src.endsWith(".svg.tsx")))
    return InlineSvgImage(props);

  if (props.rel == "icon")
    return Favicon(props);

  switch (getExt(props.src)) {
    case "tsx": return SvgTsxImage(props);
    case "svg": return SvgImage(props);
    case "png": return PngImage(props);
    default:
      throw new Error(`Unsupported image extension: ${props.src}`);
  }
};

/** Builds a fragment URL for ids inside bundled SVG content. */
const url = (id: string): string => `url(#${id})`;

export {
  Favicon,
  Image,
  InlineSvgImage,
  PngImage,
  SvgImage,
  SvgTsxImage,
  url
};

export default Image;

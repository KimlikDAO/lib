import { SAXParser } from "sax";
import { htmlTag } from "../util/html";
import { getExt } from "../util/paths";
import compiler from "./compiler/compiler";
import { Props, removeGlobalProps } from "./props";

const makeImageElement = (bundleName, { inSvg, piggyback, childTargets, ...props }) => {
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
  return htmlTag(inSvg ? "image" : "img", props, true);
}

const makeTargetName = (parentTarget, suffix) => {
  const lastSlash = parentTarget.lastIndexOf("/");
  parentTarget = parentTarget.slice(0, parentTarget.indexOf(".", lastSlash));
  return parentTarget.startsWith("build") ? `/${parentTarget}${suffix}` : `/build/${parentTarget}${suffix}`;
}

/**
 * We optimize the inline svgs regardless of the build mode.
 *
 * @param {Props} props
 * @returns {Promise<string>}
 */
const InlineSvgImage = ({ src, childTargets, bundleWidth, bundleHeight, ...props }) =>
  compiler.buildTarget(makeTargetName(src, ".inl.svg"), {
    childTargets: childTargets || [`/${src}`],
    ...props
  }).then(({ content }) => {
    removeGlobalProps(props);
    delete props.inline;
    delete props.piggyback;
    const parser = new SAXParser(true);
    let result = "";
    parser.onopentag = ({ name, attributes }) => {
      if (name == "svg")
        Object.assign(attributes, props);
      result += htmlTag(name, attributes, false);
    };
    parser.ontext = (text) => {
      result += text;
    };
    parser.onclosetag = (tagName) => {
      result += `</${tagName}>`;
    };
    parser.write(new TextDecoder().decode(content)).close();
    return result;
  });

const SvgImage = ({ inline, BuildMode, bundleName, bundleWidth, bundleHeight, ...props }) => {
  if (inline) return InlineSvgImage(props);
  return compiler.bundleTarget(makeTargetName(props.src, props.width ? `-w${props.width}.svg` : ".svg"), {
    BuildMode,
    bundleName,
    childTargets: props.childTargets || [`/${props.src}`]
  }).then((computedBundleName) => makeImageElement(computedBundleName, props));
}

const SvgJsxImage = ({ src, ...props }) => {
  const svgTarget = `/build/${src.slice(0, -8)}.jsx.svg`;
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

const PngImage = ({ src, passes, quality, BuildMode, bundleWidth, bundleHeight, ...props }) =>
  compiler.bundleTarget(`/build/${src.slice(0, -4)}.webp`, {
    BuildMode,
    passes,
    quality,
    bundleWidth,
    bundleHeight,
    childTargets: [`/${src}`]
  }).then((bundledName) => makeImageElement(bundledName, props));

const Favicon = ({ src, raster, BuildMode, ...props }) => {
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
  ]).then(([svgBundled, pngBundled]) =>
    htmlTag("link", { rel: "icon", href: svgBundled, type: "image/svg+xml" }) +
    htmlTag("link", { rel: "icon", href: pngBundled, type: "image/png", sizes: `${raster}x${raster}` })
  )
};

/**
 * @param {Record<string, unknown>} props
 * @return {Promise<string>}
 */
const Image = ({ inline, ...props }) => {
  if (inline && (props.src.endsWith(".svg") || props.src.endsWith(".svg.jsx")))
    return InlineSvgImage(props);

  if (props.rel == "icon")
    return Favicon(props);

  return {
    "jsx": SvgJsxImage,
    "svg": SvgImage,
    "png": PngImage,
  }[getExt(props.src)](props);
};

/**
 * @param {string} id
 * @return {string}
 */
const url = (id) => `url(#${id})`;

export {
  Favicon,
  Image,
  InlineSvgImage,
  PngImage,
  SvgImage,
  SvgJsxImage,
  url
};

export default Image;

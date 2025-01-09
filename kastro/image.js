import { SAXParser } from "sax";
import { tagYaz } from "../util/html";
import { getExt } from "../util/paths";
import compiler from "./compiler/compiler";
import { Props } from "./compiler/targetRegistry";
import { removeGlobalProps } from "./props";

const makeImageElement = (bundleName, { inSvg, piggyback, childTargets, ...props }) => {
  removeGlobalProps(props);
  if (piggyback)
    bundleName = piggyback + bundleName;
  if (inSvg) props.href = bundleName;
  else props.src = bundleName;
  return tagYaz(inSvg ? "image" : "img", props, true);
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
 * @returns {!Promise<string>}
 */
const InlineSvgImage = ({ src, childTargets, ...props }) =>
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
      if (name === "svg")
        Object.assign(attributes, props);
      result += tagYaz(name, attributes, false);
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

const SvgImage = ({ inline, BuildMode, bundleName, ...props }) => {
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
      childTargets: [{ targetName: svgTarget, props: svgProps }],
      ...props
    }));
}

const PngImage = ({ src, passes, quality, BuildMode, ...props }) =>
  compiler.bundleTarget(`/build/${src.slice(0, -4)}.webp`, {
    BuildMode,
    passes,
    quality,
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
    tagYaz("link", { rel: "icon", href: svgBundled, type: "image/svg+xml" }) +
    tagYaz("link", { rel: "icon", href: pngBundled, type: "image/png", sizes: `${raster}x${raster}` })
  )
};

/**
 * @param {!Object<string, *>} props
 * @return {!Promise<string>}
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

export {
  Favicon,
  Image,
  InlineSvgImage,
  PngImage,
  SvgImage,
  SvgJsxImage
};

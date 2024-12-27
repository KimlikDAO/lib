import { SAXParser } from "sax";
import { tagYaz } from "../util/html";
import { getExt } from "../util/paths";
import compiler from "./compiler/compiler";
import { Props } from "./compiler/targetRegistry";
import { removeGlobalProps } from "./props";

/**
 * We optimize the inline svgs regardless of the build mode.
 *
 * @param {Props} props
 * @returns {!Promise<string>}
 */
const InlineSvgImage = ({ src, ...props }) =>
  compiler.buildTarget(`/build/${src.slice(0, -4)}.inl.svg`, {
    childTargets: [`/${src}`],
    ...props
  }).then(({ content }) => {
    removeGlobalProps(props);
    delete props.inline;
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

const makeImageElement = (bundledName, props) => {
  removeGlobalProps(props);
  props.src = bundledName;
  return tagYaz("img", props, true);
}

const SvgImage = ({ src, inline, BuildMode, ...props }) => {
  if (inline) return InlineSvgImage({ src, ...props });
  const suffix = props.width ? "_w" + props.width : "";
  return compiler.bundleTarget(`/build/${src.slice(0, -4)}${suffix}.svg`, {
    BuildMode,
    childTargets: [`/${src}`]
  }).then((bundledName) => makeImageElement(bundledName, props));
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
  if (inline) {
    if (!props.src.endsWith(".svg"))
      throw new Error("We only inline svgs; for other formats serving directly is more efficient");
    return InlineSvgImage(props)
  }
  if (props.rel == "icon")
    return Favicon(props);

  return {
    "svg": SvgImage,
    "png": PngImage,
  }[getExt(props.src)](props);
};

export {
  Favicon,
  Image,
  InlineSvgImage,
  PngImage,
  SvgImage
};

import { mkdir, readFile } from "node:fs/promises";
import { SAXParser } from "sax";
import { optimize } from "svgo";
import { tagYaz } from "../../util/html";
import { getExt } from "../../util/paths";
import { getByKey } from "./hashcache/buildCache";
import { hashAndCompressContent, hashFile } from "./hashcache/compression";
import SvgoConfig from "./svgoConfig";
import SvgoInlineConfig from "./svgoInlineConfig";


const removeGlobalProps = (props) => {
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      delete props[prop];
}

const webp = (inputName, outputName, passes = 10, quality = 70) =>
  mkdir(getDir(outputName), { recursive: true }).then(() =>
    spawn([
      "cwebp",
      "-m", 6,
      "-pass", passes,
      "-q", quality,
      inputName,
      "-o", outputName
    ]).exited);

/**
 * We optimize the inline svgs regardless of the build mode.
 *
 * @param {!Object<string, *>} props
 * @returns {!Promise<string>}
 */
const InlineSvgImage = ({ src, ...props }) =>
  getByKey("InlineSvgImage:" + src, () =>
    getByKey(src, () => readFile(src, "utf-8"))
      .then((svg) => optimize(svg, SvgoInlineConfig).data))
    .then((svg) => {
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
      parser.write(svg).close();
      return result;
    });

const SvgImage = ({ src, inline, BuildMode, ...props }) => inline
  ? InlineSvgImage({ src, ...props })
  : (BuildMode == 0
    ? Promise.resolve(src)
    : getByKey(src, () => readFile(src, "utf-8")
      .then((svg) => hashAndCompressContent(optimize(svg, SvgoConfig).data, "svg"))
    ))
    .then((hashedName) => {
      removeGlobalProps(props);
      props.src = hashedName;
      return tagYaz("img", props, true);
    });

const PngImage = ({ src, passes, quality, BuildMode, ...props }) => (BuildMode == 0
  ? Promise.resolve(src)
  : getByKey(src, () => {
    const webpName = `build/${src.slice(0, -4)}.webp`;
    return webp(src, webpName, passes, quality)
      .then(() => hashFile(webpName))
  }))
  .then((hashedName) => {
    removeGlobalProps(props)
    props.src = hashedName;
    return tagYaz("img", props, true);
  });

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
  return {
    "svg": SvgImage,
    "png": PngImage,
  }[getExt(props.src)](props);
};

export { Image, InlineSvgImage, PngImage, SvgImage };

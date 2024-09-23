import { spawn } from "bun";
import { mkdir, readFile } from "node:fs/promises";
import { SAXParser } from "sax";
import { optimize } from "svgo";
import { tagYaz } from "../util/html";
import { getDir, getExt } from "../util/paths";
import { getByKey } from "./compiler/hashcache/buildCache";
import { hashAndCompressContent, hashFile } from "./compiler/hashcache/compression";
import SvgoConfig from "./compiler/svgoConfig";
import SvgoInlineConfig from "./compiler/svgoInlineConfig";

const removeGlobalProps = (props) => {
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      delete props[prop];
}

const rsvgConvert = (inputFile, outputFile, size) =>
  mkdir(getDir(outputFile), { recursive: true })
    .then(() => spawn(["rsvg-convert", "-w", size, "-h", size, "-o", outputFile, inputFile]).exited);

const pngcrushInPlace = (inputFile) =>
  spawn(["pngcrush", "-ow", "-brute", inputFile]).exited;

const webp = (inputFile, outputFile, passes = 10, quality = 70) =>
  mkdir(getDir(outputFile), { recursive: true })
    .then(() =>
      spawn(["cwebp", "-m", 6, "-pass", passes, "-q", quality, inputFile, "-o", outputFile]).exited);

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

const Favicon = ({ src, raster, BuildMode, ...props }) => {
  removeGlobalProps(props);
  console.log("Favicon", src, raster, BuildMode);
  return Promise.all([
    (BuildMode == 0
      ? Promise.resolve(src)
      : getByKey(src, () => readFile(src, "utf-8")
        .then((svg) => hashAndCompressContent(optimize(svg, SvgoConfig).data, "svg"))
      ))
      .then((hashedName) => tagYaz("link", { ...props, href: hashedName, type: "image/svg+xml" }, true)),
    (BuildMode == 0 || !raster)
      ? Promise.resolve("")
      : getByKey(`build/${src.slice(0, -4)}${raster}.png`, () =>
        rsvgConvert(src, `build/${src.slice(0, -4)}${raster}.png`, raster)
          .then(() => pngcrushInPlace(`build/${src.slice(0, -4)}${raster}.png`))
          .then(() => hashFile(`build/${src.slice(0, -4)}${raster}.png`))
      )
        .then((hashedName) => tagYaz("link", { ...props, href: hashedName, type: "image/png", sizes: `${raster}x${raster}` }, true))
  ]).then((results) => results.join(""));
};

/**
 * @param {!Object<string, *>} props
 * @return {!Promise<string>}
 */
const Image = ({ inline, ...props }) => {
  console.log("Image()", props);
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

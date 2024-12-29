import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { optimize } from "svgo";
import { getDir } from "../../util/paths";
import SvgoConfig from "./config/svgoConfig";
import SvgoInlineConfig from "./config/svgoInlineConfig";

const Decoder = new TextDecoder();

const webp = (inputFile, outputFile, passes = 10, quality = 70) =>
  mkdir(getDir(outputFile), { recursive: true })
    .then(() =>
      spawn(["cwebp", "-m", 6, "-pass", passes, "-q", quality, inputFile, "-o", outputFile]).exited);

const rsvgConvert = (inputFile, outputFile, size) =>
  mkdir(getDir(outputFile), { recursive: true })
    .then(() => spawn(["rsvg-convert", "-w", size, "-h", size, "-o", outputFile, inputFile]).exited);

const pngcrushInPlace = (inputFile) =>
  spawn(["pngcrush", "-ow", "-brute", inputFile]).exited;

/** @const {TargetFunction} */
const pngTarget = (targetName, props) => {
  if (props.raster)
    return props.childTargets[0]
      .then(({ targetName: childTargetName }) => rsvgConvert(childTargetName.slice(1), targetName.slice(1), props.raster))
      .then(() => pngcrushInPlace(targetName.slice(1)))
      .then(() => { });
  throw "pngTarget(): not supported";
}

/** @const {TargetFunction} */
const webpTarget = (targetName, props) =>
  props.childTargets[0]
    .then(({ targetName: childTargetName }) =>
      webp(childTargetName.slice(1), targetName.slice(1), props.passes, props.quality))
    .then(() => { });

/** @const {TargetFunction} */
const svgTarget = (_, props) => props.childTargets[0]
  .then(({ content }) => optimize(Decoder.decode(content), SvgoConfig).data);

/** @const {TargetFunction} */
const inlineSvgTarget = (_, props) => props.childTargets[0]
  .then(({ content }) => optimize(Decoder.decode(content), SvgoInlineConfig).data);

/** @const {TargetFunction} */
const jsxSvgTarget = (_, props) => props.childTargets[0]
  .then(({ targetName: childTargetName }) => import(childTargetName))
  .then((mod) => mod.default(props));

export {
  inlineSvgTarget,
  jsxSvgTarget,
  pngTarget,
  svgTarget,
  webpTarget
};

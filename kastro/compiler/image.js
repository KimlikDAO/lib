import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { optimize } from "svgo";
import SvgoConfig from "./config/svgoConfig";
import SvgoInlineConfig from "./config/svgoInlineConfig";

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
    return rsvgConvert(props.childTargets[0].targetName.slice(1), targetName.slice(1), props.raster)
      .then(() => pngcrushInPlace(targetName.slice(1)));
  throw "pngTarget(): not supported";
}

/** @const {TargetFunction} */
const svgTarget = (_, props) =>
  props.childTargets[0].then(({ content }) => optimize(content, SvgoConfig).data);

/** @const {TargetFunction} */
const inlineSvgTarget = (_, props) =>
  props.childTargets[0].then(({ content }) => optimize(content, SvgoInlineConfig).data);

export {
  inlineSvgTarget,
  pngcrushInPlace,
  pngTarget,
  rsvgConvert,
  svgTarget,
  webp
};

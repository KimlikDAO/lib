import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { optimize } from "svgo";
import { getDir } from "../../util/paths";
import render from "../transpiler/render.js";
import SvgoConfig from "./config/svgoConfig";
import SvgoInlineConfig from "./config/svgoInlineConfig";

const Decoder = new TextDecoder();

const optimizeChildTarget = (props, config) => props.childTargets[0]
  .then(({ content }) => optimize(Decoder.decode(content), config).data);

const renderTsxSvg = (props) => props.childTargets[0]
  .then(({ targetName: childTargetName }) => import(childTargetName))
  .then((mod) => render({
    name: mod.default,
    props
  }, props));

const webp = (inputFile, outputFile, { passes = 10, quality = 70, bundleWidth, bundleHeight }) =>
  mkdir(getDir(outputFile), { recursive: true })
    .catch(() => { })
    .then(() => {
      const cmds = ["cwebp", "-m", 6, "-pass", passes, "-q", quality];
      if (bundleWidth && bundleHeight)
        cmds.push("-resize", bundleWidth, bundleHeight);
      return spawn(cmds.concat([inputFile, "-o", outputFile])).exited;
    });

const rsvgConvert = (inputFile, outputFile, size) =>
  mkdir(getDir(outputFile), { recursive: true })
    .catch(() => { })
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
      webp(childTargetName.slice(1), targetName.slice(1), props))
    .then(() => { });

/** @const {TargetFunction} */
const svgTarget = (_, props) => optimizeChildTarget(props, SvgoConfig);

/** @const {TargetFunction} */
const inlineSvgTarget = (_, props) => optimizeChildTarget(props, SvgoInlineConfig);

/** @const {TargetFunction} */
const tsxSvgTarget = (_, props) => renderTsxSvg(props);

export {
  inlineSvgTarget,
  pngTarget,
  svgTarget,
  tsxSvgTarget,
  webpTarget
};

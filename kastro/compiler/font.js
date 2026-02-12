import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { getDir } from "../../util/paths";

/**
 * Converts a TTF font file to WOFF2 format.
 *
 * @param {string} inputFile - The path to the input TTF file.
 * @return {Promise<void>} A promise that resolves when the conversion is complete.
 */
const woff2 = (inputFile) => spawn({
  cmd: [
    "woff2_compress",
    inputFile
  ],
  stdout: "pipe",
  stderr: "pipe"
}).exited;

const ttfTarget = (targetName, props) => Promise.all(props.childTargets)
  .then(([{ targetName: ttfName }, { targetName: specimenName }]) =>
    mkdir(getDir(targetName.slice(1)), { recursive: true })
      .catch(() => { })
      .then(() => spawn({
        cmd: [
          "pyftsubset",
          ttfName.slice(1),
          "--no-recommended-glyphs",
          "--no-hinting",
          "--with-zopfli",
          "--canonical-order",
          "--recalc-bounds",
          `--text-file=${specimenName.slice(1)}`,
          `--output-file=${targetName.slice(1)}`
        ],
        stdout: "pipe", stderr: "pipe"
      }).exited)
  )
  .then(() => { });

const woff2Target = (targetName, props) =>
  props.childTargets[0].then((childTarget) => {
    const ttfName = childTarget.targetName;
    if (ttfName.slice(0, -3) != targetName.slice(0, -5))
      return Promise.reject(new Error(`Not supported yet: ${ttfName} != ${targetName}`));
    return woff2(ttfName.slice(1)).then(() => { });
  });

export {
  woff2Target,
  ttfTarget
};

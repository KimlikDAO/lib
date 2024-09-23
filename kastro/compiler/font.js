import { spawn } from "bun";
import { mkdir } from "node:fs/promises";
import { getDir } from "../../util/paths";

/**
 * Converts a TTF font file to WOFF2 format.
 *
 * @param {string} inputFile - The path to the input TTF file.
 * @return {!Promise<void>} A promise that resolves when the conversion is complete.
 */
const woff2 = (inputFile) => spawn({
  cmd: [
    "woff2_compress",
    inputFile
  ],
  stdout: "pipe",
  stderr: "pipe"
}).exited;

/**
 * @param {string} targetName 
 * @param {!Array<string>} fileDeps
 * @param {!Array<string>} _ 
 * @return {!Promise<void>}
 */
const subsetFont = (targetName, [href, specimenName], _) =>
  mkdir(getDir(targetName), { recursive: true })
    .then(() => spawn({
      cmd: [
        "pyftsubset",
        href,
        "--no-recommended-glyphs",
        "--no-hinting",
        "--with-zopfli",
        "--canonical-order",
        "--recalc-bounds",
        `--text-file=${specimenName}`,
        `--output-file=${targetName}`
      ],
      stdout: "pipe",
      stderr: "pipe"
    }).exited);

export { woff2, subsetFont };

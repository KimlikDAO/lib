import { spawn } from "bun";
import { rename } from "node:fs/promises";

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .gz extension
 * @return {!Promise<string>}
 */
const zopfli = (inputName, outputName) => {
  console.info(`zopfli: ${inputName} -> ${outputName}.gz`);
  return spawn({
    cmd: [
      "touch",
      "-d", "2024-01-01T00:00:00",
      `${inputName}`
    ],
    stdout: "pipe",
    stderr: "pipe"
  }).exited.then(() => spawn({
    cmd: [
      "zopfli",
      "--force",
      "--best",
      "--i20",
      inputName
    ],
    stdout: "pipe",
    stderr: "pipe"
  }).exited
    .then(() => rename(inputName + ".gz", outputName + ".gz")))
    .then(() => outputName + ".gz");
}

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .br extension
 * @return {!Promise<string>}
 */
const brotli = (inputName, outputName) => {
  console.info(`brotli: ${inputName} -> ${outputName}.br`);
  return spawn({
    cmd: [
      "brotli",
      "--force",
      "-w", "24",
      "--quality=11",
      "--no-copy-stat",
      `--output=${outputName}.br`,
      inputName,
    ],
    stdout: "pipe",
    stderr: "pipe"
  }).exited.then(() => outputName + ".br");
}

export { brotli, zopfli };

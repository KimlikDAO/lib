import { file, spawn, write } from "bun";
import { getExt } from "../../util/paths";
import { CompressedMimes } from "../workers/mimes";

const BundleDir = "build/bundle";

/**
 * @param {string} source
 * @param {string} destination
 * @param {boolean=} noOverwrite
 * @return {Promise<void>}
 */
const cp = async (source, destination, noOverwrite = false) => {
  if (noOverwrite && await file(destination).exists())
    return;
  return write(destination, file(source));
};

/**
 * @param {string} hashedName
 * @param {string} bundleName
 * @return {Promise<void>}
 */
const alias = (hashedName, bundleName) => {
  const promises = [cp(`${BundleDir}/${hashedName}`, `${BundleDir}/${bundleName}`)];
  if (!CompressedMimes[getExt(hashedName)])
    promises.push(
      cp(`${BundleDir}/${hashedName}.br`, `${BundleDir}/${bundleName}.br`),
      cp(`${BundleDir}/${hashedName}.gz`, `${BundleDir}/${bundleName}.gz`)
    );
  return Promise.all(promises);
}

/**
 * Copies targetFile into the bundle as bundleName; optionally creates .br and .gz.
 * Uses Bun.write for the main copy.
 *
 * @param {string} targetFile Source file path (e.g. "build/landing/kdjs-en/landing/Landing.js")
 * @param {string} bundleName Filename in the bundle (e.g. "abc123.js" or "landing-en.js")
 * @return {Promise<void>}
 */
const add = (targetFile, bundleName) => {
  const bundlePath = `${BundleDir}/${bundleName}`;
  const promises = [cp(targetFile, bundlePath, true)];
  if (!CompressedMimes[getExt(targetFile)])
    promises.push(
      brotli(targetFile, bundlePath),
      zopfli(targetFile, bundlePath)
    );
  return Promise.all(promises);
};

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .gz extension
 * @return {Promise<string>}
 */
const zopfli = async (inputName, outputName) => {
  const outputNameExt = outputName + ".gz";
  if (await file(outputNameExt).exists())
    return outputNameExt;
  return spawn({
    cmd: [
      "touch",
      "-d", "2026-01-01T00:00:00",
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
    ]
  }).exited
    .then(() => cp(inputName + ".gz", outputNameExt)))
    .then(() => outputNameExt);
};

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .br extension
 * @return {Promise<string>}
 */
const brotli = async (inputName, outputName) => {
  const outputNameExt = outputName + ".br";
  if (await file(outputNameExt).exists())
    return outputNameExt;
  console.info(`brotli: ${outputName}.br <- ${inputName}`);
  return spawn({
    cmd: [
      "brotli",
      "--force",
      "-w", "24",
      "--quality=11",
      "--no-copy-stat",
      `--output=${outputNameExt}`,
      inputName,
    ],
    stdout: "pipe",
    stderr: "pipe"
  }).exited.then(() => outputNameExt);
}

export default {
  add,
  alias,
};

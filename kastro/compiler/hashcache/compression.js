import { spawn } from "bun";
import { access, cp, readFile, rename, writeFile } from "node:fs/promises";
import { getExt } from "../../../util/paths";
import { hash } from "./hash";

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .gz extension
 * @return {!Promise<string>}
 */
const zopfli = (inputName, outputName) => {
  console.info(`zopfli: ${inputName} -> ${outputName}`);
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
  console.info(`brotli: ${inputName} -> ${outputName}`);
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

/**
 * @param {string} fileName
 * @return {!Promise<string>} hashed name of the file
 */
const hashAndCompressFile = (fileName) => readFile(fileName)
  .then((bytes) => {
    const hashedName = hash(bytes) + "." + getExt(fileName);
    const crateName = "build/" + hashedName;
    return Promise.all([
      cp(fileName, crateName),
      brotli(fileName, crateName),
      zopfli(fileName, crateName)
    ])
      .then(() => hashedName);
  });

/**
 * @param {string} content
 * @param {string} extension
 * @return {!Promise<string>} hashed name of the file
 */
const hashAndCompressContent = (content, extension) => {
  const bytes = new TextEncoder().encode(content);
  const hashedName = hash(bytes) + "." + extension;
  const crateName = "build/" + hashedName;
  return writeFile(crateName, content).then(() => Promise.all([
    brotli(crateName, crateName),
    zopfli(crateName, crateName)
  ]))
    .then(() => hashedName)
}

/**
 * @param {string} fileName
 * @return {!Promise<string>} hashed name of the file
 */
const hashFile = (fileName) => readFile(fileName)
  .then((bytes) => {
    const hashedName = hash(bytes) + "." + getExt(fileName);
    return cp(fileName, "build/" + hashedName)
      .then(() => hashedName)
  });

/**
 * @param {string} fileName
 * @param {string} contentHash
 * @return {!Promise<string>} hashed name of the file
 */
const compressToHash = (fileName, contentHash) => {
  const targetName = `build/${contentHash}.${getExt(fileName)}`;
  return Promise.all([
    access(targetName).catch(() => cp(fileName, targetName)),
    access(`${targetName}.br`).catch(() => brotli(fileName, targetName)),
    access(`${targetName}.gz`).catch(() => zopfli(fileName, targetName))
  ]).then(() => targetName.slice(6));
}

const copyToHash = (fileName, contentHash) => {
  const targetName = `build/${contentHash}.${getExt(fileName)}`;
  return access(targetName)
    .catch(() => cp(fileName, targetName))
    .then(() => targetName.slice(6));
}

export {
  brotli,
  compressToHash,
  copyToHash,
  hashAndCompressContent,
  hashAndCompressFile,
  hashFile,
  zopfli
};

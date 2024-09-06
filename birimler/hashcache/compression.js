import { spawn } from "bun";
import { cp, readFile, rename, writeFile } from "node:fs/promises";
import { keccak256Uint8 } from "../../crypto/sha3";
import { getExt } from "../../util/paths";
import { base64 } from "../../util/çevir";

const zopfli = (inputName, outputName) => spawn({
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
  .then(() => rename(inputName + ".gz", outputName + ".gz")));

const brotli = (inputName, outputName) => spawn({
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
}).exited;

const hash = (bytes) => base64(keccak256Uint8(bytes).subarray(0, 6))
  .replaceAll("/", "+")
  .replaceAll("=", "-");

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

export {
  brotli,
  hashAndCompressContent,
  hashAndCompressFile,
  hashFile,
  zopfli
};

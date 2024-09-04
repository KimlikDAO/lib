import { spawn } from "bun";
import { cp, readFile, rename } from "node:fs/promises";
import { keccak256Uint8 } from "../../crypto/sha3";
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

const getExt = (fileName) => {
  const dot = fileName.indexOf(".");
  return dot == -1 ? "" : fileName.slice(dot);
}

const hashAndCompress = (fileName) => readFile(fileName)
  .then((bytes) => {
    const hashedName = base64(keccak256Uint8(bytes).subarray(0, 6))
      .replaceAll("/", "+")
      .replaceAll("=", "-") + getExt(fileName);
    const crateName = "build/" + hashedName;
    return Promise.all([
      cp(fileName, crateName),
      brotli(fileName, crateName),
      zopfli(fileName, crateName)
    ]).then(() => hashedName);
  });

export { brotli, hashAndCompress, zopfli };

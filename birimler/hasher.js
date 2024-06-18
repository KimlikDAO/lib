import { createHash } from "crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "path";
import process from "process";
import { CompressedMimes } from "./ayarlar.js";

/** @const {!Array<string>} */
let args = process.argv.slice(3);
/** @type {boolean} */
let compress = true;
/** @type {string} */
let out = "";

for (let fileName of args) {
  if (fileName == "--nocompress") {
    compress = false;
    continue;
  }

  /** @const {!Array<string>} */
  const parts = path.parse(fileName);
  /** @const {string} */
  const hash = createHash('sha256')
    .update(await readFile(fileName))
    .digest()
    .toString("base64")
    .slice(0, 8)
    .replaceAll("/", "+").replaceAll("=", "-");
  /** @const {string} */
  const hashExtension = hash + parts.ext;

  await copyFile(fileName, 'build/' + hashExtension);

  if (compress && !CompressedMimes[parts.ext.slice(1)])
    await Promise.all([
      copyFile(fileName + '.gz', 'build/' + hashExtension + '.gz'),
      copyFile(fileName + '.br', 'build/' + hashExtension + '.br')
    ]);

  if (parts.name.at(-3) === '-')
    fileName = `${parts.dir}/${parts.name.slice(0, -3)}${parts.ext}`;

  fileName = fileName.startsWith("build")
    ? fileName.slice(5)
    : "/" + fileName;
  console.log(fileName + " -> " + hashExtension);
  out += `${fileName} -> ${hashExtension}\n`;
}

await writeFile(process.argv[2], out, "utf-8");

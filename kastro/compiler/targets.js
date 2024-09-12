import { spawn } from "bun";
import { minify } from "csso";
import { mkdir, readFile } from "node:fs/promises";
import { compile } from "../../kdjs/compile";
import { getDir } from "../../util/paths";
import {
  hashAndCompressContent,
  hashAndCompressFile
} from "../hashcache/compression";

/**
 * @param {!Object<string, *>} props
 * @param {!Object<string, *>} globals
 * @return {!Promise<string>} the generated script element
 */
const compileScript = (props, globals) => {
  const entry = props.src.slice(1);
  const output = `build/${entry.slice(0, -3)}-${globals.dil}.js`;

  return compile({
    entry,
    output,
    loose: "data-loose" in props ? true : false,
    globals
  }).then(() => hashAndCompressFile(output))
    .then((compressedName) => `<script src=${compressedName} type="module">`)
}

/**
 * @param {!Array<string>} cssFileNames
 * @return {!Promise<string>} the generate stylesheet element
 */
const generateStylesheet = (cssFileNames) =>
  Promise.all(cssFileNames.map((file) => readFile(file, "utf8")))
    .then((csses) => hashAndCompressContent(minify(csses.join("\n")).css, "css"))
    .then((hashedName) => `<link rel="stylesheet" src=${hashedName} type="text/css">`);


const webp = (inputName, outputName, passes = 10, quality = 70) =>
  mkdir(getDir(outputName), { recursive: true }).then(() =>
    spawn([
      "cwebp",
      "-m", 6,
      "-pass", passes,
      "-q", quality,
      inputName,
      "-o", outputName
    ]).exited);

export { compileScript, generateStylesheet, webp };

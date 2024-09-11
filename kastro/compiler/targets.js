import { spawn } from "bun";
import { minify } from "csso";
import { mkdir, readFile } from "node:fs/promises";
import { compile } from "../../kdjs/compile";
import { getDir } from "../../util/paths";
import {
  hashAndCompressContent,
  hashAndCompressFile
} from "../hashcache/compression";
import { define } from "./defines";

const transformChainData = (chains) => chains.split("|")
  .map(segment => segment.split(',')[0])
  .join("|");

/**
 * @param {!Object<string, string>} attribs
 * @param {!Object<string, string>} scope
 * @return {!Promise<string>} the generated script element
 */
const generateScript = (attribs, scope) => {
  const entry = attribs.src.slice(1);
  const output = `build/${entry.slice(0, -3)}-${scope.dil}.js`;

  return compile({
    entry,
    output,
    loose: "data-loose" in attribs ? true : false,
    define: [
      define("lib/util/dom", "GEN", false),
      define("lib/util/dom", "TR", scope.dil = "tr" ? "true" : "false"),
      define("birim/dil/birim", "KonumTR", scope.tr),
      define("birim/dil/birim", "KonumEN", scope.en),
      define("birim/cüzdan/birim", "Chains", transformChainData(scope.Chains)),
      define("birim/cüzdan/birim", "DefaultChain", scope.DefaultChain)
    ]
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

export { generateScript, generateStylesheet, webp };

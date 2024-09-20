import { spawn } from "bun";
import { cp } from "node:fs/promises";
import { tagYaz } from "../../util/html";
import { getTargetHash } from "./hashcache/buildCache";
import { brotli, hashFile, zopfli } from "./hashcache/compression";

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

const subsetFont = (targetName, [href, specimenName]) => spawn({
  cmd: [
    "pyftsubset",
    href,
    "--no-recommended-glyphs",
    "--no-hinting",
    "--with-zopfli",
    "--canonical-order",
    "--recalc-bounds",
    `--textFile=${specimenName}`,
    `--output-file=${targetName}`
  ],
  stdout: "pipe",
  stderr: "pipe"
}).exited;

const TtfFont = ({ Lang, BuildMode, SharedCss, PageCss, shared, href, name, weight }) => {
  const match = href.match(/([^/]+?)(\d{3})?\.[^.]+$/);
  if (match) {
    name ||= match[1];
    const w = match[2];
    if (w && !isNaN(w))
      weight ||= w;
  }
  const cssName = `build/${href.slice(0, -4)}-${Lang}.css`;
  if (BuildMode == 0) {
    (shared ? SharedCss : PageCss).add({
      name: cssName,
      contents: `@font-face {
        font-family: ${name};
        src: url("${href}") format("truetype");
        font-weight: ${weight};
        font-style: normal;
        font-display: block;
      }`
    });
    return "";
  }
  const targetName = `build/${href.slice(0, -4)}-${Lang}.ttf`;
  const specimenName = `build/${href.slice(0, -4)}-${Lang}.txt`;
  return getTargetHash(targetName, [href, specimenName], subsetFont)
    .then((hash) => Promise.all([
      cp(targetName, `build/${hash}.ttf`),
      brotli(targetName, `build/${hash}.ttf`),
      zopfli(targetName, `build/${hash}.ttf`),
      woff2(targetName).then(() => hashFile(`${targetName}.woff2`))
    ])
      .then((vals) => [hash + ".ttf", vals[3]])
    )
    .then(([ttfName, woff2Name]) => {
      (shared ? SharedCss : PageCss).add({
        name: cssName,
        contents: `@font-face {
          font-family: ${name};
          src: url("${woff2Name}") format("woff2"),
               url("${ttfName}") format("truetype");
          font-weight: ${weight};
          font-style: normal;
          font-display: block;
        }`
      });
      return tagYaz("link", { rel: "preload", href: woff2Name, as: "font", type: "font/woff2", crossorigin });
    });
}

export { subsetFont, TtfFont, woff2 };

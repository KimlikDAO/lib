import { minify } from "html-minifier";
import { writeFileSync } from "node:fs";
import { optimize } from "svgo";
import htmlMinifierConfig from "./sayfa/htmlMinifierConfig.js";
import svgoConfig from "./sayfa/svgoConfig.js";
import { sayfaOku } from "./sayfa/eskiOkuyucu.js";

/** @const {!Array<string>} */
const args = process.argv;

if (args[3] == "--svg") {
  /** @const {string} */
  const out = optimize(sayfaOku(args[2], { dil: "en" }, {}), svgoConfig).data;
  writeFileSync("build/" + args[2], out);
} else {
  /** @const {string} */
  const out = minify(sayfaOku(args[2], { dil: args[3] }, {}), htmlMinifierConfig);

  /** @const {!Array<string>} */
  const parts = args[2].split('.');
  writeFileSync(`build/${parts[0].slice(0, -6)}-${args[3]}.${parts[1]}`, out);
}

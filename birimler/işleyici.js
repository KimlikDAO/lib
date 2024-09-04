import { minify } from "html-minifier";
import { writeFileSync } from "node:fs";
import { optimize } from "svgo";
import htmlMinifierConfig from "./sayfa/htmlMinifierConfig.js";
import svgoConfig from "./sayfa/svgoConfig.js";
import { sayfaOku } from "./sayfa/eskiOkuyucu.js";

/** @const {!Array<string>} */
const args = process.argv;

const EN = {
  al: "mint",
  iptal: "revoke",
  kpassim: "kpass",
  oyla: "vote",
  tr: "en",
}
if (args[3] == "--svg") {
  /** @const {string} */
  const out = optimize(
    (await sayfaOku({ konum: args[2], dil: "en" }, {})).html,
    svgoConfig
  ).data;
  writeFileSync("build/" + args[2], out);
} else {
  /** @const {string} */
  const out = minify(
    (await sayfaOku({ konum: args[2], dil: args[3] }, {})).html,
    htmlMinifierConfig
  );

  let name = args[2].split('/')[0];
  if (name == "ana") name = "tr";
  if (args[3] == "en") name = EN[name];
  writeFileSync(`build/${name}.html`, out);
}

import { tagYaz } from "../util/html";
import { subsetFont, woff2 } from "./compiler/font";
import { getTargetHash } from "./compiler/hashcache/buildCache";
import { compressToHash, copyToHash } from "./compiler/hashcache/compression";

const TtfFont = ({ Lang, BuildMode, SharedCss, PageCss, shared, href: fontFile, name, weight }) => {
  const match = fontFile.match(/([^/]+?)(\d{3})?\.[^.]+$/);
  if (match) {
    name ||= match[1];
    const w = match[2];
    if (w && !isNaN(w))
      weight ||= w;
  }
  const cssName = `build/${fontFile.slice(0, -4)}-${Lang}.css`;
  if (BuildMode == 0) {
    (shared ? SharedCss : PageCss).add({
      name: cssName,
      contents: `@font-face {
        font-family: ${name};
        src: url("${fontFile}") format("truetype");
        font-weight: ${weight};
        font-style: normal;
        font-display: block;
      }`
    });
    return "";
  }
  const specimenName = `${fontFile.slice(0, -4)}-${Lang}.txt`;
  const ttfTarget = `build/${fontFile.slice(0, -4)}-${Lang}.ttf`;
  const woff2Target = `${ttfTarget.slice(0, -4)}.woff2`;
  return getTargetHash(ttfTarget, [fontFile, specimenName], null, subsetFont)
    .then((hash) => Promise.all([
      compressToHash(ttfTarget, hash),
      getTargetHash(woff2Target, [ttfTarget], null, (_, [ttfTarget], _stringDeps) => woff2(ttfTarget))
        .then((hash) => copyToHash(woff2Target, hash))
    ]))
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
      return tagYaz("link", { rel: "preload", href: woff2Name, as: "font", type: "font/woff2", crossorigin: null });
    });
}

export { TtfFont };

import { tagYaz } from "../util/html";
import { LangCode } from "../util/i18n";
import compiler from "./compiler/compiler";

/**
 * @param {{
 *   Lang: LangCode,
 *   BuldMode: compiler.BuildMode,
 *   SharedCss: Set<string>,
 *   PageCss: Set<string>,
 *   shared: boolean,
 *   href: string,
 *   name: string,
 *   weight: number
 * }} params
 * @return {!Promise<string>}
 */
const TtfFont = ({ Lang, BuildMode, SharedCss, PageCss, shared, href, name, weight }) => {
  const match = href.match(/([^/]+?)(\d{3})?\.[^.]+$/);
  if (match) {
    name ||= match[1];
    const w = match[2];
    if (w && !isNaN(w))
      weight ||= w;
  }
  const fontBase = href.slice(0, -4);
  const cssTarget = `/build/${fontBase}-${Lang}.css`;
  if (BuildMode == 0) {
    (shared ? SharedCss : PageCss).add({
      name: cssTarget,
      contents: `@font-face {
        font-family: ${name};
        src: url("${href}") format("truetype");
        font-weight: ${weight};
        font-style: normal;
        font-display: block;
      }`
    });
    return Promise.resolve("");
  }
  const ttfTarget = `/build/${fontBase}-${Lang}.ttf`;
  return compiler.bundleTarget(ttfTarget, {
    childTargets: [`/${fontBase}.ttf`, `/${fontBase}-${Lang}.txt`],
    Lang
  }).then((ttfBundled) => compiler.bundleTarget(`${fontBase}.woff2`, { childTargets: [ttfTarget] })
    .then((woff2Bundled) => {
      (shared ? SharedCss : PageCss).add({
        name: cssTarget,
        contents: `@font-face {
          font-family: ${name};
          src: url("${woff2Bundled}") format("woff2"),
               url("${ttfBundled}") format("truetype");
          font-weight: ${weight};
          font-style: normal;
          font-display: block;
        }`
      });
      return tagYaz("link", {
        rel: "preload", href: woff2Bundled, as: "font", type: "font/woff2", crossorigin: null
      });
    })
  );
}

export { TtfFont };

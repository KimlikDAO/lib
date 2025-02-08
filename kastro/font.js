import { tagYaz } from "../util/html";
import { LangCode } from "../util/i18n";
import compiler from "./compiler/compiler";
import { addStyleSheet } from "./stylesheet";

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
    addStyleSheet(shared, {
      targetName: cssTarget,
      content: `@font-face {
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
  const ttfProps = {
    childTargets: [`/${fontBase}.ttf`, `/${fontBase}-${Lang}.txt`],
    Lang
  };

  return compiler.bundleTarget(ttfTarget, ttfProps)
    .then((ttfBundled) => compiler.bundleTarget(`/build/${fontBase}-${Lang}.woff2`, {
      childTargets: [{ targetName: ttfTarget, props: ttfProps }]
    }).then((woff2Bundled) => {
      addStyleSheet(shared, {
        targetName: cssTarget,
        content: `@font-face {
          font-family: ${name};
          src: url("${woff2Bundled}") format("woff2"),
               url("${ttfBundled}") format("truetype");
          font-weight: ${weight};
          font-style: normal;
          font-display: block;
        }`
      });
      return tagYaz("link", {
        rel: "preload", href: woff2Bundled, as: "font", type: "font/woff2", crossorigin: true
      });
    })
    );
}

export { TtfFont };

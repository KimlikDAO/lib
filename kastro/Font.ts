import { LangCode } from "../util/i18n";
import { htmlTag } from "../util/markup/html";
import compiler from "./compiler/compiler";
import { addStyleSheet } from "./StyleSheet";

const Font = async ({
  Lang,
  BuildMode,
  shared,
  href,
  name,
  weight,
}: {
  Lang: LangCode;
  BuildMode: number;
  SharedCss: Set<string>;
  PageCss: Set<string>;
  shared: boolean;
  href: string;
  name?: string;
  weight?: number;
}): Promise<string> => {
  const match = href.match(/([^/]+?)(\d{3})?\.[^.]+$/);
  if (match) {
    name ??= match[1];
    const w = match[2];
    if (w && !isNaN(Number(w))) weight ??= Number(w);
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
      }`,
    });
    return "";
  }

  const ttfTarget = `/build/${fontBase}-${Lang}.ttf`;
  const ttfProps = {
    childTargets: [`/${fontBase}.ttf`, `/${fontBase}-${Lang}.txt`],
    Lang,
  };

  const ttfBundled = await compiler.bundleTarget(ttfTarget, ttfProps);
  const woff2Bundled = await compiler.bundleTarget(
    `/build/${fontBase}-${Lang}.woff2`,
    {
      childTargets: [{ targetName: ttfTarget, ...ttfProps }],
    } as unknown as Parameters<typeof compiler.bundleTarget>[1]
  );

  addStyleSheet(shared, {
    targetName: cssTarget,
    content: `@font-face {
      font-family: ${name};
      src: url("${woff2Bundled}") format("woff2"),
           url("${ttfBundled}") format("truetype");
      font-weight: ${weight};
      font-style: normal;
      font-display: block;
    }`,
  });
  return htmlTag("link", {
    rel: "preload",
    href: woff2Bundled,
    as: "font",
    type: "font/woff2",
    crossorigin: true,
  }, true);
};

export default Font;

import { minify } from "csso";

/** @const {TextDecoder} */
const Decoder = new TextDecoder();

const styleSheetTarget = (targetName, { BuildMode, childTargets }) => Promise.all(childTargets)
  .then((targets) => {
    const allCss = targets
      .map((t) => Decoder.decode(t.content)).join("");
    return BuildMode == 0
      ? allCss
      : minify(allCss, { comments: false }).css || " ";
  });

export { styleSheetTarget };

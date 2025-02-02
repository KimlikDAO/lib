import { minify } from "html-minifier";
import { getDir } from "../../util/paths";
import { makeStyleSheetCollection } from "../stylesheet";
import HtmlMinifierConfig from "./config/htmlMinifierConfig";
import { initGlobals } from "./pageGlobals";

/**
 * @param {string} targetName
 * @param {Props} props
 * @return {!Promise<string>}
 */
const pageTarget = (targetName, props) => {
  /** @const {string} */
  const targetDir = getDir(targetName);
  props.SharedCss = makeStyleSheetCollection(`${targetDir}/shared-${props.Lang}.css`);
  props.PageCss = makeStyleSheetCollection(`${targetDir}/page-${props.Lang}.css`);
  initGlobals(props);

  return import(`${targetDir.slice(7)}/page.jsx`)
    .then((jsx) => jsx.default(props))
    .then((html) => {
      const renderStyleSheets = ({ BuildMode, SharedCss, PageCss }) => {
        if (BuildMode == 0) {
          SharedCss.addAll(SharedCss.entries());
          return SharedCss({ BuildMode });
        } else {
          PageCss.removeAll(SharedCss.entries());
          return Promise.all([SharedCss({ BuildMode }), PageCss({ BuildMode })])
            .then(([shared, page]) => shared + page);
        }
      }
      return renderStyleSheets(props)
        .then((styleSheets) => {
          html = "<!DOCTYPE html>" + html.replace("</head>", styleSheets + "</head>");
          return props.BuildMode == 0
            ? html : minify(html, HtmlMinifierConfig);
        });
    });
}

export { pageTarget };

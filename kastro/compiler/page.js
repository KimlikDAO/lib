import { minify } from "html-minifier";
import { capitalize, getDir } from "../../util/paths";
import { filterGlobalProps } from "../props";
import { Script } from "../script";
import { makeStyleSheets } from "../stylesheet";
import { initComponentProps } from "../transpiler/componentProps";
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
  /** @const {string} */
  const targetModuleName = capitalize(targetDir.slice(getDir(targetDir).length + 1));
  /** @const {string} */
  const targetModulePath = `${targetDir.slice(7)}/${targetModuleName}.jsx`;

  const { BuildMode, Lang } = props;
  initGlobals(props);
  initComponentProps(targetModuleName, { BuildMode, Lang });
  const StyleSheets = makeStyleSheets();
  return import(targetModulePath)
    .then((jsx) => jsx.default({ BuildMode, Lang }).render())
    .then((html) => Promise.all([
      StyleSheets({ BuildMode, Lang, targetDir }),
      Script({ src: targetModulePath, ...filterGlobalProps(props) })
    ])
      .then(([styleSheets, script]) => {
        html = "<!DOCTYPE html>" + html.replace("</head>", styleSheets + script + "</head>");
        return BuildMode == 0
          ? html : minify(html, HtmlMinifierConfig);
      })
    )
}

export { pageTarget };

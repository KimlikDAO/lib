import { minify } from "html-minifier";
import { capitalize, getDir } from "../../util/paths";
import { filterGlobalProps } from "../props";
import { Script } from "../Script";
import { makeStyleSheets } from "../StyleSheet";
import { initGlobals } from "../transpiler/pageGlobals";
import HtmlMinifierConfig from "./config/htmlMinifierConfig";

/**
 * Builds all dependencies of a page, including its js and css and returns
 * the resulting html as a string.
 *
 * @param {string} targetName
 * @param {Props} props
 * @return {Promise<string>}
 */
const pageTarget = (targetName, props) => {
  const targetDir = getDir(targetName);
  const targetModuleName = capitalize(targetDir.slice(getDir(targetDir).length + 1));
  const targetModulePath = `/${targetDir.slice(7)}/${targetModuleName}`;

  const { BuildMode, Lang } = props;

  initGlobals(props);
  const StyleSheets = makeStyleSheets();

  return import(targetModulePath)
    .then((jsx) => jsx.default({ BuildMode, Lang }).render())
    .then((html) => Promise.all([
      StyleSheets({ BuildMode, Lang, targetDir }),
      ""//Script({ src: targetModulePath, ...filterGlobalProps(props) })
    ])
      .then(([styleSheets, script]) => {
        html = "<!DOCTYPE html>" + html.replace("</head>", styleSheets + script + "</head>");
        return BuildMode == 0
          ? html : minify(html, HtmlMinifierConfig);
      })
    )
}

export { pageTarget };

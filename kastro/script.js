import { tagYaz } from "../util/html";
import { splitFullExt } from "../util/paths";
import compiler from "./compiler/compiler";
import { getGlobals } from "./compiler/pageGlobals";
import { Props } from "./props";

/**
 * @param {Props} props
 * @return {!Promise<string>}
 */
const Script = (props) => {
  const [file,] = splitFullExt(props.src);
  const targetName = `/build/${file}-${props.Lang}.js`;
  return Promise.all([].concat(props.children ?? [])).then(() =>
    compiler.bundleTarget(targetName, {
      dynamicDeps: true,
      childTargets: ["/" + props.src], // Used in BuildMode.Dev only
      ...props,
    }).then((bundleName) => {
      if (props.bundleKey)
        getGlobals()[props.bundleKey] = bundleName;
      return tagYaz("script", { type: "module", src: bundleName }, false) + "</script>"
    })
  );
}

export { Script };

import { tagYaz } from "../util/html";
import compiler from "./compiler/compiler";
import { getGlobals } from "./compiler/pageGlobals";

/**
 * @param {Object} props
 * @return {!Promise<string>}
 */
const Script = (props) => {
  const globals = getGlobals();
  for (const key in props)
    if (key.charCodeAt(0) < 91) globals[key] = props[key];

  return Promise.all([].concat(props.children ?? [])).then(() =>
    compiler.bundleTarget(`/build/${props.src.slice(0, -3)}-${props.Lang}.js`, {
      dynamicDeps: true,
      childTargets: ["/" + props.src], // Used in BuildMOde.Dev only
      ...props,
      ...globals
    }).then((bundleName) => {
      if (props.bundleKey) globals[props.bundleKey] = bundleName;
      return tagYaz("script", { type: "module", src: bundleName }, false) + "</script>"
    })
  );
}

export { Script };

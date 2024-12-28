import { tagYaz } from "../util/html";
import compiler from "./compiler/compiler";

/**
 * @param {Object} props
 * @return {!Promise<string>}
 */
const Script = (props) =>
  compiler.bundleTarget(`/build/${props.src.slice(0, -3)}-${props.Lang}.js`, {
    dynamicDeps: true,
    childTargets: ["/" + props.src], // Used in BuildMOde.Dev only
    ...props
  }).then((bundledName) => tagYaz("script", { type: "module", src: bundledName }, false) + "</script>");

export { Script };

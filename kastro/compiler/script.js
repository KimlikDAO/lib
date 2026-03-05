import { compile } from "../../kdjs/compile";
import { filterGlobalProps, filterOutGlobalProps } from "../props";
import { transpile } from "../transpiler/transpiler";

/** @const {TargetFunction} */
const scriptTarget = (_, { src: entry, ...props }) => {
  const isolateDir = props.Lang ? "kdjs-" + props.Lang : "kdjs";
  const { globals, ...rest} = filterOutGlobalProps(props);
  return compile({
    entry,
    isolateDir,
    globals: {
      ...props.globals,
      ...filterGlobalProps(props),
      GEN: false
    },
    ...rest
  }, props.checkFreshFn, transpile);
}

export { scriptTarget };

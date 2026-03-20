import { compile } from "../../kdts/compile";
import { filterGlobalProps, filterOutGlobalProps } from "../props";
import { transpile } from "../transpiler/transpiler";

/** @const {TargetFunction} */
const scriptTarget = (_, { src: entry, ...props }) => {
  const isolateDir = props.Lang ? "kdts-" + props.Lang : "kdts";
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

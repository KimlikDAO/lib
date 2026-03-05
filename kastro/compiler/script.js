import { compile } from "../../kdjs/compile";
import { filterGlobalProps, filterOutGlobalProps } from "../props";
import { transpile } from "../transpiler/transpiler";

/** @const {TargetFunction} */
const scriptTarget = (_, { src: entry, ...props }) => {
  const isolateDir = props.Lang ? "kdjs-" + props.Lang : "kdjs";
  return compile({
    entry,
    isolateDir,
    globals: {
      ...filterGlobalProps(props),
      GEN: false
    },
    ...filterOutGlobalProps(props)
  }, props.checkFreshFn, transpile);
}

export { scriptTarget };

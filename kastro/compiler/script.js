import { compile } from "../../kdjs/compile";
import { filterGlobalProps } from "../props";

/** @const {TargetFunction} */
const scriptTarget = (_, props) => {
  const params = {
    entry: props.src,
    isolateDir: `kdjs-${props.Lang}`,
    globals: {
      ...filterGlobalProps(props),
      GEN: false
    }
  };
  if (props.strict) params.globals.strict = true;
  return compile(params, props.checkFreshFn);
}

export { scriptTarget };

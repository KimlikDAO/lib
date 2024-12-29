import { compile } from "../../kdjs/compile";
import { filterGlobalProps } from "../props";

/** @const {TargetFunction} */
const scriptTarget = (_, props) => {
  const params = {
    entry: props.src,
    globals: {
      ...filterGlobalProps(props),
      GEN: false
    }
  };
  if (props.strict) params.strict = true;
  return compile(params, props.checkFreshFn);
}

export { scriptTarget };

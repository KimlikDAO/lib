import { compile } from "../../kdjs/compile";
import { filterGlobalProps, filterOutGlobalProps } from "../props";

/** @const {TargetFunction} */
const scriptTarget = (_, { src: entry, ...props }) => {
  const params = {
    entry,
    isolateDir: `kdjs-${props.Lang}`,
    globals: {
      ...filterGlobalProps(props),
      GEN: false
    },
    ...filterOutGlobalProps(props)
  };
  return compile(params, props.checkFreshFn);
}

export { scriptTarget };

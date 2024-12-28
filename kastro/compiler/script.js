import { compile } from "../../kdjs/compile";
import { filterGlobalProps } from "../props";

/** @const {TargetFunction} */
const scriptTarget = (_, props) =>
  compile({
    entry: props.src,
    globals: filterGlobalProps(props),
  },
    props.checkFreshFn
  );

export { scriptTarget };

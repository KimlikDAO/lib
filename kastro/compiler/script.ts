import { compile } from "@kimlikdao/kdts/compiler";
import type { Props } from "../props";
import { filterGlobalProps, filterOutGlobalProps } from "../props";
import { transpile } from "../transpiler/transpiler";

type ScriptTargetProps = Props & {
  checkFreshFn?: (deps: string[]) => Promise<boolean>;
  globals?: Record<string, unknown>;
  src: string;
};

const scriptTarget = (
  _targetName: string,
  { src: entry, ...props }: ScriptTargetProps
): Promise<string | void> => {
  const isolateDir = props.Lang ? "kdts-" + props.Lang : "kdts";
  const { globals, ...rest } = filterOutGlobalProps(props);
  return compile({
    entry,
    isolateDir,
    globals: {
      ...globals,
      ...filterGlobalProps(props),
      GEN: false
    },
    ...rest
  }, props.checkFreshFn, transpile);
}

export { scriptTarget };

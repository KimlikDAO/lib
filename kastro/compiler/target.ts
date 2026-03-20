import { getFullExt } from "../../util/paths";
import { Props } from "../props";
import { Hash } from "./hash.d";

interface Target {
  targetName?: string;
  content: Uint8Array;
  contentHash: Hash;
  depHash?: Hash;
}

/**
 * Given a target name and props, builds the target and resolves to Target as is
 * or in a raw form (string or Uint8Array)
 */
type TargetFunction = (targetName: string, props: Props) => Promise<Target | string | Uint8Array | void>;

const TARGET_FUNCTIONS: Record<string, TargetFunction> = {};

const getTargetFunction = (targetName: string): TargetFunction =>
  TARGET_FUNCTIONS[getFullExt(targetName)];

const registerTargetFunction = (extension: string, func: TargetFunction): void => {
  if (TARGET_FUNCTIONS[extension])
    throw `Target function for extension "${extension}" already registered`;
  TARGET_FUNCTIONS[extension] = func;
}

export {
  getTargetFunction,
  registerTargetFunction,
  Target,
  TargetFunction
};

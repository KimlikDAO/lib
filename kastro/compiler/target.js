import { Props } from "../props";
import { ContentHash, DependencyHash } from "./hash";

/**
 * @typedef {{
 *   targetName?: string
 *   content: Uint8Array,
 *   contentHash: ContentHash,
 *   depHash?: DependencyHash
 * }}
 */
const Target = {};

/**
 * Given a target name and props, builds the target and resolves to Target as is
 * or in a raw form (string or Uint8Array)
 *
 * @typedef {(targetName: string, props: Props) => Promise<Target | string | Uint8Array | void>}
 */
const TargetFunction = {};

/** @const {Record<string, TargetFunction>} */
const TARGET_FUNCTIONS = {};

/**
 * @param {string} targetName
 * @return {TargetFunction}
 */
const getTargetFunction = (targetName) => TARGET_FUNCTIONS[getLongExt(targetName)];

/**
 * Returns all extensions of a target name.
 *
 * @param {string} targetName 
 * @return {string}
 */
const getLongExt = (targetName) => {
  const nameIdx = targetName.lastIndexOf("/");
  return targetName.slice(targetName.indexOf(".", nameIdx));
}

/**
 * @param {string} extension 
 * @param {TargetFunction} func 
 */
const registerTargetFunction = (extension, func) => {
  if (TARGET_FUNCTIONS[extension])
    throw `Target function for extension "${extension}" already registered`;
  TARGET_FUNCTIONS[extension] = func;
}

export {
  getLongExt,
  getTargetFunction,
  Props,
  registerTargetFunction,
  Target,
  TargetFunction
};

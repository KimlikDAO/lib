import { Props } from "../props";
import { ContentHash, DependencyHash } from "./hash";

/**
 * @typedef {{
 *   targetName: (string|undefined)
 *   content: Uint8Array,
 *   contentHash: ContentHash,
 *   depHash: (DependencyHash|undefined)
 * }}
 */
const Target = {};

/**
 * A target function
 * @typedef {function(string, Props): Promise<Target|string|Uint8Array|void>}
 */
const TargetFunction = {};

/** @const {Object<string, TargetFunction>} */
const TARGET_FUNCTIONS = {};

/**
 * @param {string} targetName
 * @return {TargetFunction}
 */
const getTargetFunction = (targetName) => TARGET_FUNCTIONS[getLongExt(targetName)];

/**
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
  TargetFunction
};

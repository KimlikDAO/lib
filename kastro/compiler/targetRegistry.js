import { Props } from "../props";
import { ContentHash, DependencyHash } from "./hash";

/**
 * @typedef {{
 *   content: !Uint8Array,
 *   contentHash: ContentHash,
 *   depHash: (DependencyHash|undefined)
 * }}
 */
const CacheEntry = {};

/**
 * @typedef {function(string, Props): !Promise<CacheEntry|string|!Uint8Array|void>}
 */
const TargetFunction = {};

/** @const {!Object<string, TargetFunction>} */
const TARGET_FUNCTIONS = {};

/**
 * @param {string} targetName 
 * @return {TargetFunction}
 */
const getTargetFunction = (targetName) => {
  const nameIdx = targetName.lastIndexOf("/");
  return TARGET_FUNCTIONS[targetName.slice(targetName.indexOf(".", nameIdx))]
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
  getTargetFunction,
  Props,
  registerTargetFunction,
  TargetFunction
};

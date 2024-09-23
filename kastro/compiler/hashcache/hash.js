import { base64 } from "../../../util/çevir";

/** @typedef {string} */
const HashName = {};

/** @typedef {!Uint8Array} */
const ContentHash = {};

/** @typedef {!Uint8Array} */
const DependencyHash = {};

/**
 * @param {!Uint8Array} bytes
 * @return {HashName}
 */
const hash = (bytes) => base64(bytes.subarray(0, 6))
  .replaceAll("/", "+")
  .replaceAll("=", "-");

export {
  ContentHash,
  DependencyHash,
  hash,
  HashName
};

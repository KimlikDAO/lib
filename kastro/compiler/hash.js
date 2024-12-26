import { base64 } from "../../util/çevir";

/** @typedef {!Uint8Array} */
const ContentHash = {};

/** @typedef {!Uint8Array} */
const DependencyHash = {};

/**
 * @param {!Uint8Array} bytes
 * @return {string}
 */
const toStr = (bytes) => base64(bytes.subarray(0, 6))
  .replaceAll("/", "+")
  .replaceAll("=", "-");

const equal = (a, b) => {
  for (let i = 0; i < 32; ++i)
    if (a[i] !== b[i]) return false;
  return true;
};

const combine = (a, b) => {
  for (let i = 0; i < 32; ++i)
    a[i] += b[i];
}

export {
  ContentHash,
  DependencyHash
};

export default {
  toStr,
  equal,
  combine,
};

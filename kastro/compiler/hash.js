import { base64 } from "../../util/çevir";

/** @typedef {!Uint8Array} */
const ContentHash = {};

/** @typedef {!Uint8Array} */
const DependencyHash = {};

/** @typedef {string} */
const AssetHash = {};

/**
 * @param {!Uint8Array} bytes
 * @return {AssetHash}
 */
const toStr = (bytes) => base64(bytes.subarray(0, 6))
  .replaceAll("/", "+")
  .replaceAll("=", "-");

/**
 * @param {ContentHash} a
 * @param {ContentHash} b
 * @return {boolean}
 */
const equal = (a, b) => {
  for (let i = 0; i < 32; ++i)
    if (a[i] !== b[i]) return false;
  return true;
};

/**
 * @param {ContentHash} a
 * @param {ContentHash} b
 */
const combine = (a, b) => {
  for (let i = 0; i < 32; ++i)
    a[i] += b[i];
}

export {
  ContentHash,
  DependencyHash,
  AssetHash,
};

export default {
  toStr,
  equal,
  combine,
};

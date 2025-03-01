import hex from "./hex";

/**
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {string}
 */
const from = (bytes) => {
  /** @type {string} */
  let binary = "";
  /** @const {number} */
  const len = bytes.length;
  for (let i = 0; i < len; ++i)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * @nosideeffects
 * @param {bigint} n
 * @return {string}
 */
const fromBigInt = (n) => from(hex.toUint8Array(n.toString(16)));

/**
 * @nosideeffects
 * @param {string} base64
 * @return {bigint}
 */
const toBigInt = (base64) => BigInt('0x' + hex.from(toBytes(base64)));

/**
 * @nosideeffects
 * @param {string} base64
 * @return {!Uint8Array}
 */
const toBytes = (base64) => {
  /** @const {string} */
  const decoded = atob(base64);
  /** @const {number} */
  const len = decoded.length;
  /** @const {!Uint8Array} */
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; ++i)
    bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

/**
 * @param {!Uint8Array|!Array<number>} bytes
 * @param {string} base64
 */
const intoBytes = (bytes, base64) => {
  /** @const {string} */
  const decoded = atob(base64);
  /** @const {number} */
  const len = decoded.length;
  for (let i = 0; i < len; ++i)
    bytes[i] = decoded.charCodeAt(i);
}

export default {
  fromBigInt,
  from,
  toBigInt,
  toBytes,
  intoBytes,
};

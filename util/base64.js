import hex from "./hex";

/**
 * @nosideeffects
 * @param {Uint8Array} bytes
 * @return {string}
 */
const from = (bytes) => bytes.toBase64();

/**
 * TODO(KimlikDAO-bot): consider toString(8) route.
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
 * @return {Uint8Array<ArrayBuffer>}
 */
const toBytes = (base64) => Uint8Array.fromBase64(base64);

/**
 * @param {Uint8Array} bytes
 * @param {string} base64
 */
const intoBytes = (bytes, base64) => bytes.setFromBase64(base64);

export default {
  fromBigInt,
  from,
  toBigInt,
  toBytes,
  intoBytes,
};

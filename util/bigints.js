import hex from "./hex";

/**
 * @param {!Uint8Array|!Array<number>} bytes
 * @param {number} length 
 * @param {bigint|number} n
 */
const intoBytesBE = (bytes, length, n) => {
  /** @const {string} */
  const str = n.toString(16);
  for (let i = str.length, j = length - 1; i > 0; --j, i -= 2)
    bytes[j] = parseInt(str.substring(i - 2, i), 16);
}

/**
 * @param {!Uint8Array|!Array<number>} bytes
 * @param {bigint|number} n
 */
const intoBytesLE = (bytes, n) => {
  /** @const {string} */
  const str = n.toString(16);
  for (let /** number */ i = str.length, j = 0; i > 0; i -= 2, ++j)
    bytes[j] = parseInt(str.substring(i - 2, i), 16);
}

/**
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {bigint}
 */
const fromBytesBE = (bytes) => BigInt("0x" + hex.from(bytes));

/**
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {bigint}
 */
const fromBytesLE = (bytes) => BigInt("0x" + hex.fromBytesLE(bytes));

export default {
  intoBytesBE,
  intoBytesLE,
  fromBytesBE,
  fromBytesLE,
}

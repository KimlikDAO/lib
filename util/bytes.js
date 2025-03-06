/**
 * @nosideeffects
 * @param {!Uint32Array} arr
 * @return {!Uint8Array}
 */
const fromUint32ArrayBE = (arr) => {
  /** @const {number} */
  const n = arr.length * 4;
  /** @const {!Uint8Array} */
  const bytes = new Uint8Array(n);
  for (let i = 0, j = 0; j < n; ++i, j += 4) {
    const word = arr[i];
    bytes[j + 0] = word >>> 24;
    bytes[j + 1] = (word >>> 16) & 0xff;
    bytes[j + 2] = (word >>> 8) & 0xff;
    bytes[j + 3] = word & 0xff;
  }
  return bytes;
};

/**
 * @nosideeffects
 * @param {!Uint8Array} bytes
 * @return {!Uint32Array}
 */
const toUint32ArrayBE = (bytes) => {
  /** @const {number} */
  const n = bytes.length;
  /** @const {!Uint32Array} */
  const arr = new Uint32Array((n + 3) / 4);
  for (let i = 0, j = 0; j < n; ++i, j += 4)
    arr[i] = (bytes[j + 0] << 24)
      | (bytes[j + 1] << 16)
      | (bytes[j + 2] << 8)
      | bytes[j + 3];
  return arr;
};

export default {
  fromUint32ArrayBE,
  toUint32ArrayBE,
};

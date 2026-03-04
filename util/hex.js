/** 
 * @noinline
 * @const {string}
 */
const FromUint4 = "0123456789abcdef";

/**
 * @const {string[]}
 */
const FromUint8 = /** @pureOrBreakMyCode */((
  /** @return {string[]} */ () => {
    /** @const {string[]} */
    const arr = Array(256);
    for (let i = 0; i < 256; ++i)
      arr[i] = /** @type {string} */(FromUint4[i >> 4]) + FromUint4[i & 15];
    return arr;
  })());

/** @const {Record<string, string>} */
const ToBinary = /** @pureOrBreakMyCode */((
  /** @return {Record<string, string>} */ () => {
    /** @const {Record<string, string>} */
    const toBinary = {};
    for (let i = 0; i < 16; ++i) {
      /** @const {string} */
      const h = FromUint4[i];
      toBinary[h.toUpperCase()] = toBinary[h]
        = i.toString(2).padStart(4, "0");
    }
    return toBinary;
  })());

/**
 * @nosideeffects
 * @param {string} hexStr
 * @return {string}
 */
const toBinary = (hexStr) =>
  Array.from(hexStr, (/** @type {string} */ s) => ToBinary[s]).join("");

/**
 * @nosideeffects
 * @noinline
 * @param {Uint8Array} bytes
 * @return {string}
 */
const from = (bytes) => bytes.toHex();

/**
 * @nosideeffects
 * @param {Uint8Array | number[]} bytes
 * @return {string}
 */
const fromBytesLE = (bytes) => {
  /** @const {number} */
  const n = bytes.length;
  /** @const {string[]} */
  const octets = Array(n);
  for (let /** number */ i = n; i > 0; --i)
    octets[n - i] = FromUint8[bytes[i - 1]];
  return octets.join("");
}

/**
 * @nosideeffects
 * @param {Uint32Array} words
 * @return {string}
 */
const fromUint32ArrayBE = (words) => {
  const n = 4 * words.length;
  /** @const {string[]} */
  const octets = Array(n);
  for (let /** number */ i = 0, j = 0; i < n; i += 4, ++j) {
    octets[i + 0] = FromUint8[words[j] >>> 24];
    octets[i + 1] = FromUint8[(words[j] >>> 16) & 255];
    octets[i + 2] = FromUint8[(words[j] >>> 8) & 255];
    octets[i + 3] = FromUint8[words[j] & 255];
  }
  return octets.join("");
}

/**
 * @nosideeffects
 * @param {string} str hex string
 * @return {Uint8Array} byte array
 */
const toUint8Array = (str) => Uint8Array.fromHex(str.length & 1 ? "0" + str : str);

/**
 * @param {Uint8Array | number[]} bytes
 * @param {string} str
 */
const intoBytes = (bytes, str) => {
  const n = str.length;
  for (let i = -(n & 1), j = 0; i < n; ++j, i += 2)
    bytes[j] = parseInt(str.substring(i, i + 2), 16);
}

/**
 * @param {Uint32Array | number[]} words
 * @param {number} length of the Uint32Array segment to fill
 * @param {string} str
 */
const intoUint32ArrayBE = (words, length, str) => {
  for (let i = str.length - 8, j = length - 1; i >= 0; --j, i -= 8)
    words[j] = parseInt(str.slice(i, i + 8), 16);
}

export default {
  FromUint8,
  from,
  fromBytesLE,
  fromUint32ArrayBE,
  intoBytes,
  intoUint32ArrayBE,
  toBinary,
  toUint8Array,
};

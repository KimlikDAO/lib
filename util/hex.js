/** 
 * @noinline
 * @const {string}
 */
const FromUint4 = "0123456789abcdef";

/**
 * @const {!Array<string>}
 */
const FromUint8 = /** @pureOrBreakMyCode */((() => {
  /** @const {!Array<string>} */
  const arr = Array(256);
  for (let i = 0; i < 256; ++i)
    arr[i] = FromUint4[i >> 4] + FromUint4[i & 15];
  return arr;
})());


/** @const {!Object<string, string>} */
const ToBinary = /** @pureOrBreakMyCode */((() => {
  /** @const {!Object<string, string>} */
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
  Array.from(hexStr, (/** string */ s) => ToBinary[s]).join("");

/**
 * @nosideeffects
 * @noinline
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {string}
 */
const from = (bytes) => {
  /** @const {!Array<string>} */
  const octets = new Array(bytes.length);
  for (let /** number */ i = 0; i < bytes.length; ++i)
    octets[i] = FromUint8[bytes[i]];
  return octets.join("");
}

/**
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes 
 * @return {string}
 */
const fromBytesLE = (bytes) => {
  /** @const {number} */
  const n = bytes.length;
  /** @const {!Array<string>} */
  const octets = Array(n);
  for (let /** number */ i = n; i > 0; --i)
    octets[n - i] = FromUint8[bytes[i - 1]];
  return octets.join("");
}

/**
 * @nosideeffects
 * @param {string} str hex string
 * @return {!Uint8Array} byte array
 */
const toUint8Array = (str) => {
  if (str.length & 1) str = "0" + str;
  /** @const {!Uint8Array} */
  const buff = new Uint8Array(str.length / 2);
  for (let i = 0, j = 0; i < str.length; ++j, i += 2) {
    const high = str.charCodeAt(i);
    const low = str.charCodeAt(i + 1);
    const highVal = high - (high <= 57 ? 48 : (high <= 70 ? 55 : 87));
    const lowVal = low - (low <= 57 ? 48 : (low <= 70 ? 55 : 87));
    buff[j] = (highVal * 16) | lowVal;
  }
  return buff;
}

/**
 * @param {!Uint8Array} buff
 * @param {string} str
 */
const intoBytes = (buff, str) => {
  const n = str.length;
  for (let i = -(n & 1), j = 0; i < n; ++j, i += 2)
    buff[j] = parseInt(str.substring(i, i + 2), 16);
}

/**
 * @param {!Uint32Array} buff
 * @param {number} length of the Uint32Array segment to fill
 * @param {string} str
 */
const intoUint32ArrayBE = (buff, length, str) => {
  for (let i = str.length - 8, j = length - 1; i >= 0; --j, i -= 8)
    buff[j] = parseInt(str.slice(i, i + 8), 16);
}

export default {
  from,
  fromBytesLE,
  FromUint8,
  intoBytes,
  intoUint32ArrayBE,
  toBinary,
  toUint8Array,
};

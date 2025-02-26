import hexadecimal from "./hex";

/**
 * @param {!Uint8Array} buff
 * @param {string} str
 */
const uint8ArrayeHexten = hexadecimal.intoUint8Array;

/**
 * @param {!Uint8Array|!Array<number>} buffer
 * @param {string} b64
 */
const uint8ArrayeBase64ten = (buffer, b64) => {
  /** @const {string} */
  const decoded = atob(b64);
  /** @const {number} */
  const len = decoded.length;
  for (let i = 0; i < len; ++i)
    buffer[i] = decoded.charCodeAt(i);
}

/**
 * @param {!Uint8Array} buff
 * @param {number} bytes
 * @param {bigint|number} n
 */
const uint8ArrayBEyeSayıdan = (buff, bytes, n) => {
  /** @const {string} */
  const str = n.toString(16);
  for (let /** number */ i = str.length, j = bytes - 1; i > 0; i -= 2, --j)
    buff[j] = parseInt(str.substring(i - 2, i), 16);
}

/**
 * @param {!Uint8Array} buff
 * @param {bigint|number} n
 */
const uint8ArrayLEyeSayıdan = (buff, n) => {
  /** @const {string} */
  const str = n.toString(16);
  for (let /** number */ i = str.length, j = 0; i > 0; i -= 2, ++j)
    buff[j] = parseInt(str.substring(i - 2, i), 16);
}

/**
 * @param {!Uint8Array} bytes
 * @return {bigint}
 */
const uint8ArrayLEtoBigInt = (bytes) => BigInt("0x" + uint8ArrayLEtoHex(bytes));

/**
 * @param {!Uint8Array} bytes
 * @return {bigint}
 */
const uint8ArrayBEtoBigInt = (bytes) => BigInt("0x" + hexadecimal.from(bytes));

/**
 * @param {!Uint8Array} buff hex'e çevrilecek Uint8Array.
 * @return {string} hex temsil eden dizi.
 */
const uint8ArrayLEtoHex = (buff) => {
  /** @const {number} */
  const n = buff.length;
  /** @const {!Array<string>} */
  const ikililer = Array(n);
  for (let /** number */ i = n; i > 0; --i)
    ikililer[n - i] = hexadecimal.FromUint8[buff[i - 1]];
  return ikililer.join("");
}

export {
  uint8ArrayBEtoBigInt,
  uint8ArrayBEyeSayıdan,
  uint8ArrayeBase64ten,
  uint8ArrayeHexten,
  uint8ArrayLEtoBigInt,
  uint8ArrayLEtoHex,
  uint8ArrayLEyeSayıdan
};

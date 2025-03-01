/**
 * @const {string}
 * @noinline
 */
const Base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * @const {!Array<number>}
 */
const Base58Map = Array(256);
for (let i = 0; i < Base58Chars.length; ++i)
  Base58Map[Base58Chars.charCodeAt(i)] = i;

/**
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {string}
 */
const from = (bytes) => {
  /** @const {!Array<number>} */
  const codes = [];

  for (const byte of bytes) {
    /** @type {number} */
    let carry = byte;
    for (let j = 0; j < codes.length; ++j) {
      carry += Base58Map[codes[j]] << 8;
      codes[j] = Base58Chars.charCodeAt(carry % 58);
      carry = (carry / 58) | 0;
    }
    while (carry) {
      codes.push(Base58Chars.charCodeAt(carry % 58));
      carry = (carry / 58) | 0;
    }
  }
  for (const byte of bytes)
    if (byte) break; else codes.push(49);
  return String.fromCharCode(...codes.reverse());
}

/**
 * @nosideeffects
 * @param {string} str
 * @return {!Uint8Array}
 */
const toBytes = (str) => {
  /** @const {number} */
  const n = str.length;
  /** @const {!Array<number>} */
  const bytes = [];
  for (let i = 0; i < n; ++i) {
    let carry = Base58Map[str.charCodeAt(i)];
    for (let j = 0; j < bytes.length; ++j) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 255;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 255);
      carry >>= 8;
    }
  }
  for (let q = 0; q < n && str.charCodeAt(q) == 49; q++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

export default {
  from,
  toBytes,
};

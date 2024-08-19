import hexadecimal from "./hex";

/**
 * @nosideeffects
 * @noinline
 * @param {!Uint8Array} buff hex'e çevrilecek Uint8Array.
 * @return {string} hex temsil eden dizi.
 */
const hex = hexadecimal.from;

/**
 * @nosideeffects
 * @param {string} str hex olarak kodlanmış veri.
 * @return {!Uint8Array} byte dizisi
 */
const hexten = hexadecimal.toUint8Array;

/**
 * @param {!Uint8Array} buff
 * @param {string} str
 */
const uint8ArrayeHexten = hexadecimal.intoUint8Array;

/**
 * Verilen bir hex dizisini Uint32Array'e yazar.
 *
 * Uzunluğu 8'in katı olmayan hex dizileriyle kullanıldığında dikkatli
 * olunmalı: en sağdaki tam olmayan öbek dolgusuz LE olarak okunur.
 *
 * @param {!Uint32Array} buff
 * @param {string} str
 */
const uint32ArrayeHexten = hexadecimal.intoUint32Array;

/**
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes base64'e dönüştürülecek buffer.
 * @return {string} base64 temsil eden dizi.
 */
const base64 = (bytes) => {
  /** @type {string} */
  let binary = "";
  /** @const {number} */
  const len = bytes.length;
  for (let i = 0; i < len; ++i)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * @param {string} b64 base64 olarak yazılı veri.
 * @return {!Uint8Array}
 */
const base64ten = (b64) => {
  /** @const {string} */
  const decoded = atob(b64);
  /** @const {number} */
  const len = decoded.length;
  /** @const {!Uint8Array} */
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; ++i)
    buffer[i] = decoded.charCodeAt(i);
  return buffer;
};

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
 * @param {number} bits
 * @param {!bigint} n
 */
const uint8ArrayBEyeSayıdan = (buff, bits, n) => {
  /** @const {string} */
  const str = n.toString(16);
  for (let /** number */ i = str.length, j = (bits / 8) - 1; i > 0; i -= 2, --j)
    buff[j] = parseInt(str.substring(i - 2, i), 16);
}

/**
 * @param {!Uint8Array} buff
 * @param {!bigint} n
 */
const uint8ArrayLEyeSayıdan = (buff, n) => {
  /** @const {string} */
  const str = n.toString(16);
  for (let /** number */ i = str.length, j = 0; i > 0; i -= 2, ++j)
    buff[j] = parseInt(str.substring(i - 2, i), 16);
}

/**
 * TODO(KimlikDAO-bot): Try microbenchmarking to determine whether to use
 * `toString(8)` and concat adjacent characters into base64.
 *
 * @param {!bigint|number} sayı
 * @return {string} base64 olarak yazılmış sayı.
 */
const sayıdanBase64e = (sayı) => base64(hexten(sayı.toString(16)));

/**
 * TODO(KimlikDAO-bot): Try microbenchmarking to determine whether to use
 * `toString(8)` and concat adjacent characters into base64.
 *
 * @param {string} str
 * @return {!bigint}
 */
const base64tenSayıya = (str) => BigInt("0x" + hex(base64ten(str)));

/**
 * @param {!Uint8Array} bytes
 * @return {!bigint}
 */
const uint8ArrayLEtoBigInt = (bytes) => BigInt("0x" + uint8ArrayLEtoHex(bytes));

/**
 * @param {!Uint8Array} bytes
 * @return {!bigint}
 */
const uint8ArrayBEtoBigInt = (bytes) => BigInt("0x" + hex(bytes));

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
  base64,
  base64ten,
  base64tenSayıya,
  hex,
  hexten,
  sayıdanBase64e,
  uint32ArrayeHexten,
  uint8ArrayBEtoBigInt,
  uint8ArrayBEyeSayıdan,
  uint8ArrayLEtoBigInt,
  uint8ArrayLEtoHex,
  uint8ArrayLEyeSayıdan,
  uint8ArrayeBase64ten,
  uint8ArrayeHexten
};

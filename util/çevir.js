/** @const {!Array<string>} */
const Uint8denHexe = Array(255);
for (let /** number */ i = 0; i < 256; ++i)
  Uint8denHexe[i] = i.toString(16).padStart(2, "0");

/**
 * @noinline
 * @param {!Uint8Array} buff hex'e çevrilecek Uint8Array.
 * @return {string} hex temsil eden dizi.
 */
const hex = (buff) => {
  /** @const {!Array<string>} */
  const ikililer = new Array(buff.length);
  for (let /** number */ i = 0; i < buff.length; ++i)
    ikililer[i] = Uint8denHexe[buff[i]];
  return ikililer.join("");
}

/**
 * @param {string} str hex olarak kodlanmış veri.
 * @return {!Uint8Array} byte dizisi
 */
const hexten = (str) => {
  if (str.length & 1) str = "0" + str;
  /** @const {!Uint8Array} */
  const buff = new Uint8Array(str.length / 2);
  for (let i = 0, j = 0; i < str.length; ++j, i += 2)
    buff[j] = parseInt(str.slice(i, i + 2), 16);
  return buff;
}

/**
 * @param {!Uint8Array} buff
 * @param {string} str
 */
const uint8ArrayeHexten = (buff, str) => {
  if (str.length & 1) str = "0" + str;
  for (let i = 0, j = 0; i < str.length; ++j, i += 2)
    buff[j] = parseInt(str.slice(i, i + 2), 16);
}

/**
 * Verilen bir hex dizisini Uint32Array'e yazar.
 *
 * Uzunluğu 8'in katı olmayan hex dizileriyle kullanıldığında dikkatli
 * olunmalı: en sağdaki tam olmayan öbek dolgusuz LE olarak okunur.
 *
 * @param {!Uint32Array} buff
 * @param {string} str
 */
const uint32ArrayeHexten = (buff, str) => {
  for (let i = 0, j = 0; i < str.length; ++j, i += 8)
    buff[j] = parseInt(str.slice(i, i + 8), 16);
}

/**
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
const uint8ArrayBEtoBigInt = (bytes) => BigInt("0x" + uint8ArrayBEtoHex(bytes));

/**
 * @param {!Uint8Array} buff hex'e çevrilecek Uint8Array.
 * @return {string} hex temsil eden dizi.
 */
const uint8ArrayBEtoHex = (buff) => {
  /** @const {number} */
  const n = buff.length;
  /** @const {!Array<string>} */
  const ikililer = new Array(n);
  for (let /** number */ i = n; i > 0; --i)
    ikililer[n - i] = Uint8denHexe[buff[i - 1]];
  return ikililer.join("");
}

export {
  Uint8denHexe,
  base64,
  base64ten,
  base64tenSayıya,
  hex,
  hexten,
  sayıdanBase64e,
  uint32ArrayeHexten,
  uint8ArrayBEtoBigInt,
  uint8ArrayBEtoHex,
  uint8ArrayeBase64ten,
  uint8ArrayeHexten
};

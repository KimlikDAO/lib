/**
 * @const {!Object<string, string>}
 */
const ToBinary = {};

/** @return {!Object<string, string>} */
const toBinaryMap = () => {
  if (!ToBinary["A"]) {
    for (let i = 0; i < 16; ++i) {
      /** @const {string} */
      const h = i.toString(16);
      ToBinary[h.toUpperCase()] = ToBinary[h]
        = i.toString(2).padStart(4, "0");
    }
  }
  return ToBinary;
}

/**
 * @nosideeffects
 * @param {string} hexStr
 * @return {string}
 */
const toBinary = (hexStr) => {
  /** @const {!Object<string, string>} */
  const toBinary = toBinaryMap();
  return Array.from(hexStr, (/** string */ s) => toBinary[s]).join("");
}

/**
 * @see https://github.com/google/closure-compiler/issues/4046
 * @const {!Array<string>}
 */
const FromUint8 = Array(256);
for (let /** number */ i = 0; i < 16; ++i)
  for (let /** number */ j = 0; j < 16; ++j)
    FromUint8[(16 * i) | j] = String.fromCharCode(i < 10 ? i + 48 : i + 87) +
      String.fromCharCode(j < 10 ? j + 48 : j + 87);

/**
 * @nosideeffects
 * @noinline
 * @param {!Uint8Array} bytes
 * @return {string}
 */
const from = (bytes) => {
  /** @const {!Array<string>} */
  const ikililer = new Array(bytes.length);
  for (let /** number */ i = 0; i < bytes.length; ++i)
    ikililer[i] = FromUint8[bytes[i]];
  return ikililer.join("");
}

/**
 * @nosideeffects
 * @param {string} str hex olarak kodlanmış veri.
 * @return {!Uint8Array} byte dizisi
 */
const toUint8Array = (str) => {
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
const intoUint8Array = (buff, str) => {
  if (str.length & 1) str = "0" + str;
  for (let i = 0, j = 0; i < str.length; ++j, i += 2)
    buff[j] = parseInt(str.slice(i, i + 2), 16);
}

/**
 * @param {!Uint32Array} buff
 * @param {string} str
 */
const intoUint32Array = (buff, str) => {
  for (let i = 0, j = 0; i < str.length; ++j, i += 8)
    buff[j] = parseInt(str.slice(i, i + 8), 16);
}

export default {
  from,
  toUint8Array,
  intoUint8Array,
  intoUint32Array,
  toBinary,
  toBinaryMap,
  FromUint8,
};

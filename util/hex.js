/**
 * @const {!Object<string, string>}
 */
const NibbleToBinary = {};

for (let i = 0; i < 16; ++i)
  NibbleToBinary[i.toString(16).toUpperCase()] = NibbleToBinary[i.toString(16)]
    = i.toString(2).padStart(4, "0");

/**
 * @param {string} hexStr
 * @return {string}
 */
const toBinary = (hexStr) => {
  const parts = Array(hexStr.length);
  for (let i = 0; i < hexStr.length; ++i)
    parts[i] = NibbleToBinary[hexStr[i]];
  return parts.join("");
}

/** @const {!Array<string>} */
const FromUint8 = Array(255);
for (let /** number */ i = 0; i < 256; ++i)
  FromUint8[i] = /** @pureOrBreakMyCode */(i.toString(16).padStart(2, "0"));

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
  FromUint8
};

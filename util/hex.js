
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
const Uint8denHexe = Array(255);
for (let /** number */ i = 0; i < 256; ++i)
  Uint8denHexe[i] = i.toString(16).padStart(2, "0");

/**
 * @noinline
 * @param {!Uint8Array} bytes
 * @return {string}
 */
const from = (bytes) => {
  /** @const {!Array<string>} */
  const ikililer = new Array(bytes.length);
  for (let /** number */ i = 0; i < bytes.length; ++i)
    ikililer[i] = Uint8denHexe[bytes[i]];
  return ikililer.join("");
}

export default {
  from,
  toBinary,
};

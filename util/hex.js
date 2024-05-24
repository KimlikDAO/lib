
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

export default {
  toBinary,
};

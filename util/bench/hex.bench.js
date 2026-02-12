import { compareImpls, compareImplsArray } from "../../testing/bench";
import hex from "../hex";

/** @const {string[]} */
const FromUint8 = hex.FromUint8;

/**
 * @param {Uint8Array} bytes
 * @return {string}
 */
const hexFrom = (bytes) => {
  /** @const {string[]} */
  const ikililer = new Array(bytes.length);
  for (let /** number */ i = 0; i < bytes.length; ++i)
    ikililer[i] = FromUint8[bytes[i]];
  return ikililer.join("");
}

/**
 * @param {Uint8Array} bytes
 * @return {string}
 */
const hexFrom_2 = (bytes) => Array.from(bytes,
  (i) => FromUint8[/** @type {number} */(i)]).join("");

const input = Uint8Array.from("0123123123123980123");
const output = hex.from(input);
console.log(input, output);

compareImpls([hexFrom_2, hexFrom, hex.from], 1000, [input], output);


/**
 * @nosideeffects
 * @param {string} str hex string
 * @return {Uint8Array} byte array
 */
const toUint8Array = (str) => {
  if (str.length & 1) str = "0" + str;
  /** @const {Uint8Array} */
  const buff = new Uint8Array(str.length / 2);
  for (let i = 0, j = 0; i < str.length; ++j, i += 2)
    buff[j] = parseInt(str.slice(i, i + 2), 16);
  return buff;
}

const toUint8Array_2 = (str) => {
  if (str.length & 1) str = "0" + str;
  /** @const {Uint8Array} */
  const buff = new Uint8Array(str.length / 2);

  for (let i = 0, j = 0; i < str.length; ++j, i += 2) {
    // Direct character code conversion instead of parseInt
    const high = str.charCodeAt(i);
    const low = str.charCodeAt(i + 1);
    const highVal = high - (high <= 57 ? 48 : (high <= 70 ? 55 : 87));
    const lowVal = low - (low <= 57 ? 48 : (low <= 70 ? 55 : 87));
    buff[j] = (highVal * 16) | lowVal;
  }

  return buff;
}

compareImplsArray([toUint8Array_2, toUint8Array, toUint8Array_2, toUint8Array], 10000, [output], input);

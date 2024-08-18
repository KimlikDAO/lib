import { compareImpls } from "../../testing/bench";
import hex from "../hex";

/** @const {!Array<string>} */
const FromUint8 = hex.FromUint8;

/**
 * @param {!Uint8Array} bytes
 * @return {string}
 */
const hexFrom = (bytes) => {
  /** @const {!Array<string>} */
  const ikililer = new Array(bytes.length);
  for (let /** number */ i = 0; i < bytes.length; ++i)
    ikililer[i] = FromUint8[bytes[i]];
  return ikililer.join("");
}

/**
 * @param {!Uint8Array} bytes
 * @return {string}
 */
const hexFrom_2 = (bytes) => Array.from(bytes,
  (i) => FromUint8[/** @type {number} */(i)]).join("");

const input = Uint8Array.from("0123123123123980123");
const output = hex.from(input);
console.log(input, output);

compareImpls([hexFrom_2, hexFrom, hex.from], 1000, [input], output);

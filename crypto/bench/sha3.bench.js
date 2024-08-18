import { compareImpls } from "../../testing/bench";
import { f, keccak256Uint32 } from "../sha3";

/**
 * Computes the keccak256 of an Uint32Array.
 *
 * @param {!Uint32Array} words A typed array of `uint32`s to be hashed.
 * @return {!Uint32Array} hash as a Uint32Arrray of length 8.
 */
const keccak256Uint32_2 = (words) => {
  /** @const {!Array<number>} */
  const s = Array(50);
  /** @type {number} */
  let i = 0;
  for (const end = words.length - 33; i < end; i += 34) {
    for (let j = 0; j < 34; ++j)
      s[j] ^= words[i + j];
    f(s);
  }
  /** @type {number} */
  let j = 0;
  for (; i < words.length; ++i, ++j) {
    s[j] ^= words[i];
  }
  s[j] ^= 1;
  s[33] ^= 1 << 31;
  f(s);
  return new Uint32Array(s.slice(0, 8));
}

const f1 = (words) => {
  const h = keccak256Uint32(words);
  let sum = 0;
  for (let i = 0; i < 8; ++i)
    sum += h[i];
  return sum
}

const f2 = (words) => {
  const h = keccak256Uint32_2(words);
  let sum = 0;
  for (let i = 0; i < 8; ++i)
    sum += h[i];
  return sum
}

compareImpls([f1, f2], 100, [Uint8Array.from("123456")], 14435971454);

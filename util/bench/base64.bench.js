import { compareImpls, compareImplsArray } from "../../testing/bench";
import base64 from "../base64";
import hex from "../hex";

/**
 * Current efficient implementation using hex
 * @nosideeffects
 * @param {bigint} n
 * @return {string}
 */
const fromBigInt = (n) => base64.from(hex.toUint8Array(n.toString(16)));

// Add benchmarks to compare implementations
compareImpls([base64.fromBigInt, fromBigInt], 10, [
  123456789n,
], "B1vNFQ==");

const from = base64.from;

const from_2 = (b) => btoa([...b].map((x) => String.fromCharCode(x)).join(""));

const from_3 = (bytes) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));

/**
 * String concatenation version (fastest in JSC/Bun)
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {string}
 */
const from_4 = (bytes) => {
  /** @type {string} */
  let binary = "";
  /** @const {number} */
  const len = bytes.length;
  for (let i = 0; i < len; ++i)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Array join version (common assumption but slower in JSC/Bun)
 * @nosideeffects
 * @param {!Uint8Array|!Array<number>} bytes
 * @return {string}
 */
const from_5 = (bytes) => {
  /** @const {!Array<string>} */
  const chars = new Array(bytes.length);
  for (let i = 0; i < bytes.length; ++i)
    chars[i] = String.fromCharCode(bytes[i]);
  return btoa(chars.join(""));
}

/** @const {string} */
const output = "U29tZSBiYXNlNjQgZGF0YS4=";
/** @const {!Uint8Array} */
const input = base64.toBytes(output);

compareImpls([from, from_2, from_3, from_4, from_5], 1000, [input], output);

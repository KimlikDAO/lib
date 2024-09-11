import { readFile } from "node:fs/promises";
import { keccak256Uint8 } from "../../crypto/sha3";

/**
 * @typedef {{
 *   content: string,
 *   hash: !Uint8Array
 * }}
 */
const CacheEntry = {};

/**
 * @const {!Object<string, Promise<CacheEntry>>}
 */
const Cache = {}

const Decoder = new TextDecoder();

/**
 * @param {string} fileName
 * @return {!Promise<CacheEntry>}
 */
const getCacheEntry = (fileName) => Cache[fileName] ||
  readFile(fileName).then((content) => Cache[fileName] = {
    content: Decoder.decode(content),
    hash: keccak256Uint8(content).slice(0, 32)
  });

/**
 * @param {string} fileName
 * @return {!Promise<!Uint8Array>}
 */
const getHash = (fileName) => getCacheEntry(fileName)
  .then((entry) => entry.hash);

export {
  getHash,
  getCacheEntry,
};

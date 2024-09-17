/**
 * @fileoverview `buildCache` keeps a mapping from asset handles to
 * promises resolving to the `hashedName`.
 *
 * During the build we make additional assumptions that we cannot make
 * in a development server such as source files never changing.
 */

import { keccak256Uint8 } from "../../../crypto/sha3";
import { getGlobals } from "../pageGlobals";

const CACHE = {};

const getByKey = (key, lambda) => CACHE[key] ||= lambda();

/**
 * @typedef {{
 *   contents: !Uint8Array,
 *   hash: !Uint8Array,
 *   depHash: (!Uint8Array|undefined)
 * }}
 */
const FileEntry = {};

const Decoder = new TextDecoder();

const getFileEntry = (fileName) => (CACHE[fileName] ||= readFile(fileName).then((contents) => ({
  contents,
  hash: keccak256Uint8(contents).slice(0, 32)
})));

const getFile = (fileName, type) => getFileEntry(fileName)
  .then(({ contents }) => type == "utf8" ? Decoder.decode(contents) : contents);

const getFileHash = (fileName) => getFileEntry(fileName).then(({ hash }) => hash);

const combineHashes = (hashes) => {
  const computedArr = new Uint8Array(32);
  for (const h of hashes)
    for (let i = 0; i < 32; ++i)
      computedArr[i] += h[i]
  return computedArr;
}

const compareHashes = (a, b) => {
  for (let i = 0; i < 32; i++)
    if (a[i] !== b[i]) return false;
  return true;
};

/**
 *
 * @param {string} fileName
 * @param {!Array<string>} deps The file names that the target depends on.
 * @param {function(!Array<string>): Promise<void>} lambda The function to run to generate the target.
 * @return {!Promise<string>}
 */
const getTargetHash = (fileName, deps, lambda) => {
  const { BuildMode } = getGlobals();
  // When BuildMode == 2, it's a clean build starting from an empty disk cache.
  // We avoid disk operations and cache everything in memory for maximum
  // efficiency.
  if (BuildMode === 2) {
    return (CACHE[fileName] ||= lambda(fileName, deps).then(() => getFileEntry(fileName)))
      .then(({ hash }) => hex(hash.subarray(0, 6)));
  };
  // In other BuildModes, we need to check if the mem-cache or the disk-cache
  // are stale by comparing the depHashes.
  Promise.all([
    Promise.all(deps.map(getFileHash)),
    CACHE[fileName]
  ]).then(([depHashes, entry]) => {
    const computedHash = combineHashes(depHashes);
    if (entry && compareHashes(entry.depHash, computedHash))
      return entry.hash;

    return readFile(`${fileName}.entry`, "utf8")
      .then((entryFile) => {
        const entry = JSON.parse(entryFile);
        if (compareHashes(entry.depHash, computedHash)) {
          CACHE[fileName] = Promise.resolve(entry);
          return entry.hash;
        }
        return Promise.reject();
      })
      .catch(() => lambda(fileName, deps)
        .then(() => readFile(fileName))
        .then((contents) => {
          const entry = {
            contents,
            hash: keccak256Uint8(contents),
            depHash: computedHash
          };
          CACHE[fileName] = Promise.resolve(entry);
          writeFile(`${fileName}.entry`, JSON.stringify({ depHash: computedHash, hash: entry.hash }));
          return entry.hash;
        }));
  });
}

export {
  FileEntry,
  getByKey,
  getFile,
  getFileHash,
  getTargetHash
};

/**
 * @fileoverview `buildCache` keeps a mapping from asset handles to
 * promises resolving to the `hashedName`.
 *
 * During the build we make additional assumptions that we cannot make
 * in a development server such as source files never changing.
 */

import { readFile, rm, writeFile } from "node:fs/promises";
import { keccak256Uint8 } from "../../../crypto/sha3";
import { getGlobals } from "../pageGlobals";
import {
  ContentHash,
  DependencyHash,
  hash
} from "./hash";

const CACHE = {};

const getByKey = (key, lambda) => CACHE[key] ||= lambda();

/**
 * @typedef {{
 *   contents: !Uint8Array,
 *   hash: ContentHash,
 *   depHash: (DependencyHash|undefined)
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

const compareHashes = (a, b) => {
  for (let i = 0; i < 32; i++)
    if (a[i] !== b[i]) return false;
  return true;
};

/**
 * @param {!Array<string>} fileDeps
 * @return {!Promise<!Uint8Array>}
 */
const computeDepHash = (fileDeps, stringDeps) => {
  const acc = new Uint8Array(32);
  const promises = fileDeps.map((dep) => getFileHash(dep).then((hash) => {
    for (let i = 0; i < 32; i++)
      acc[i] += hash[i];
  }));
  return Promise.all(promises).then(() => acc);
}

/**
 * Returns the content hash of the target file, computing it if necessary
 * using the provided lambda.
 *
 * @param {string} fileName
 * @param {!Array<string>} fileDeps The file names that the target depends on.
 * @param {!Array<string>} stringDeps An array of strings that the target depends on.
 * @param {function(string, !Array<string>, !Array<string>): Promise<*>} lambda The function to run to generate the target.
 * @return {!Promise<string>}
 */
const getTargetHash = (fileName, fileDeps, stringDeps, lambda) => {
  // console.log("getTargetHash()", fileName, fileDeps);
  const { BuildMode } = getGlobals();
  // When BuildMode == 2, it's a clean build starting from an empty disk cache.
  // We avoid disk operations and cache everything in memory for maximum
  // efficiency.
  if (BuildMode === 2) {
    return (CACHE[fileName] ||= lambda(fileName, fileDeps, stringDeps).then(() => getFileEntry(fileName)))
      .then((entry) => hash(entry.hash));
  };
  // In other BuildModes, we need to check if the mem-cache or the disk-cache
  // are stale by comparing the depHashes.
  return Promise.all([computeDepHash(fileDeps, stringDeps), CACHE[fileName]])
    .then(([computedHash, entry]) => {
      if (entry && compareHashes(entry.depHash, computedHash))
        return hash(entry.hash);

      return readFile(`${fileName}.entry`, "utf8")
        .then((entryFile) => {
          const entry = JSON.parse(entryFile);
          if (compareHashes(entry.depHash, computedHash)) {
            CACHE[fileName] = Promise.resolve(entry);
            return hash(entry.hash);
          }
          return Promise.reject();
        })
        .catch(() => Promise.all([lambda(fileName, fileDeps, stringDeps), rm(`${fileName}.entry`, { force: true })])
          .then(() => readFile(fileName))
          .then((contents) => {
            const entry = {
              contents,
              hash: keccak256Uint8(contents),
              depHash: computedHash
            };
            CACHE[fileName] = Promise.resolve(entry);
            writeFile(`${fileName}.entry`, JSON.stringify({ depHash: computedHash, hash: entry.hash }));
            return hash(entry.hash);
          })
        );
    });
}

export {
  FileEntry,
  getByKey,
  getFile,
  getFileHash,
  getTargetHash
};

import { readFile, writeFile } from "node:fs/promises";
import { keccak256Uint8 } from "../crypto/sha3";
import { hex } from "../util/çevir";
import { getHash } from "./fileCache";

/**
 * @param {string} output
 * @param {!Array<string>} deps
 * @param {function():void} run
 * @param {!Promise<{ fresh: boolean, hash: string}>}
 */
const checkFresh = async (output, deps, run) => {
  const hashesArr = await Promise.all(deps.map((dep) => readFile(dep)
    .then((depContent) => keccak256Uint8(depContent))));
  const computedArr = new Uint8Array(32);
  for (const h of hashesArr)
    for (let i = 0; i < 32; ++i)
      computedArr[i] += h[i]
  const computedHash = hex(computedArr);
  try {
    const storedHash = await readFile(output + ".hash", "utf8");
    return { fresh: storedHash == computedHash, hash: computedHash }
  } catch (_) {
    return { fresh: false, hash: computedHash };
  }
}

/**
 * @typedef {function(!Array<string>):!Promise<boolean>}
 */
const CheckFreshFn = {};

/**
 * @typedef {!Object<string, (string|boolean|!Array<string>)>}
 */
const Params = {};

/**
 * @param {!Array<string>} deps
 * @param {Params} params
 * @return {!Promise<string>} hash of all the dependencies and params
 */
const hashDepsAndParams = (deps, params) =>
  Promise.all(deps.map((dep) => getHash(dep)))
    .then((hashesArr) => {
      const encoder = new TextEncoder();
      const computedArr = keccak256Uint8(encoder.encode(
        JSON.stringify(params, Object.keys(params).sort())
      ));
      for (const h of hashesArr)
        for (let i = 0; i < 32; ++i)
          computedArr[i] += h[i]
      return hex(computedArr);
    });

/**
 * @param {function(Params, CheckFreshFn):!Promise<string>} actionFn
 * @param {Params>} params
 * @return {!Promise<string>}
 */
const runIfStale = (actionFn, params) => {
  /** @type {?string} */
  let hash;
  /** @type {?boolean} */
  let isFresh;
  /** @const {string} */
  const output = /** @type {string} */(params["output"]);
  /** @const {string} */
  const hashFile = output + ".hash";

  return actionFn(params, (allDeps) => Promise.all([
    hashDepsAndParams(allDeps, params),
    readFile(hashFile, "utf8").then(
      (content) => content,
      (_) => ""
    )
  ]).then(([computedHash, readHash]) => {
    hash = computedHash;
    return isFresh = (computedHash == readHash)
  }))
    .then((output) => isFresh
      ? output
      : writeFile(hashFile, hash).then(() => output)
    );
};

export { runIfStale };

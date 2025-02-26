import { assertEq, assertArrayEq } from "./assert";

/**
 * @param {!Array<function(?):T>} fs
 * @param {number} repeat
 * @param {!Array} args
 * @param {T} expected
 * @template T
 */
const compareImpls = (fs, repeat, args, expected) => {
  for (const f of fs) {
    console.time(f["name"]);
    for (let i = 0; i < repeat; ++i) assertEq(f.apply(null, args), expected);
    console.timeEnd(f["name"]);
  }
}

/**
 * @param {!Array<function(?):T>} fs
 * @param {number} repeat
 * @param {!Array} args
 * @param {T} expected
 * @template T
 */
const compareImplsArray = (fs, repeat, args, expected) => {
  for (const f of fs) {
    console.time(f["name"]);
    for (let i = 0; i < repeat; ++i) assertArrayEq(f.apply(null, args), expected);
    console.timeEnd(f["name"]);
  }
}

export { compareImpls, compareImplsArray };

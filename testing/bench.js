import { assertArrayEq, assertIs } from "./assert";

/**
 * @param {((...args: A[]) => T)[]} fs
 * @param {number} repeat
 * @param {A[]} args
 * @param {T} expected
 * @template A, T
 */
const compareImpls = (fs, repeat, args, expected) => {
  for (const f of fs) {
    console.time(f["name"]);
    for (let i = 0; i < repeat; ++i) assertIs(f(...args), expected);
    console.timeEnd(f["name"]);
  }
}

/**
 * @param {((...args: A[]) => T)[]} fs
 * @param {number} repeat
 * @param {A[]} args
 * @param {T} expected
 * @template A, T
 */
const compareImplsArray = (fs, repeat, args, expected) => {
  for (const f of fs) {
    console.time(f["name"]);
    for (let i = 0; i < repeat; ++i) assertArrayEq(f(...args), expected);
    console.timeEnd(f["name"]);
  }
}

export { compareImpls, compareImplsArray };

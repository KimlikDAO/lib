import process from "node:process";
import { Clear, Green, Red } from "../util/cli";

console.time("test");

/** @type {number} */
let TrueAsserts = 0;
/** @type {number} */
let FalseAsserts = 0;

/**
 * @param {boolean} value
 */
const updateCounters = (value) => value ? TrueAsserts += 1 : FalseAsserts += 1;

/**
 * @param {boolean} value
 * @return {boolean}
 */
const assert = (value) => {
  updateCounters(value);
  if (!value) console.error("Hata");
  return value;
}

/**
 * @template T
 * @param {T} given
 * @param {T} expected
 * @return {boolean}
 */
const assertEq = (given, expected) => {
  /** @const {boolean} */
  const value = given == expected;
  updateCounters(value);
  if (!value) {
    console.error(`Hata: beklenen ${expected}`);
    console.error(`       verilen ${given}`);
  }
  return value;
}

/**
 * @template T
 * @param {T[]|Uint8Array|Uint32Array} given
 * @param {T[]|Uint8Array|Uint32Array} expected
 * @return {boolean}
 */
const assertArrayEq = (given, expected) => {
  /** @type {boolean} */
  let value = true;
  if (given.length != expected.length) {
    value = false;
  } else {
    for (let i = 0; i < expected.length; ++i)
      if (given[i] != expected[i]) {
        value = false;
        break;
      }
  }
  updateCounters(value);
  if (!value) {
    console.error(`Hata: beklenen ${expected}`);
    console.error(`       verilen ${given}`);
  }
  return value;
}

/**
 * @template T
 * @param {T[]} given
 * @param {T[]} expected
 * @return {boolean}
 */
const assertElemEq = (given, expected) => {
  /** @const {Set<T>} */
  const expectSet = new Set(expected);
  /** @const {boolean} */
  const value = given.length == expectSet.size && given.every((x) => expectSet.has(x));
  updateCounters(value);
  if (!value) {
    given.forEach((e) => {
      if (!expectSet.has(e)) console.log(`Hata: fazladan eleman ${e}`);
    });
  }
  return value;
}

const assertStats = () => {
  console.log(
    `${FalseAsserts == 0 ? Green : Red}${TrueAsserts} / ${TrueAsserts + FalseAsserts} asserts true${Clear} ` +
    `(${(performance.now() | 0) / 1000} seconds)`);
  console.timeEnd("test");
  if (FalseAsserts != 0) process.exitCode = FalseAsserts;
  if (process.exitCode && process.exitCode != 0)
    console.log(`${Red}Test failed ${process.exitCode}${Clear}`);
}

const fail = () => process.exitCode = -1;

process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);
process.on("exit", assertStats);

export {
  assert,
  assertArrayEq,
  assertElemEq,
  assertEq
};

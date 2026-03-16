/**
 * Lightweight test harness assertions for benchmarks and one-off test scripts.
 *
 * Prefer `bun:test` for regular unit/integration tests. These helpers are
 * test-only (not runtime assertions): they track pass/fail counts and print a
 * summary at process exit.
 */
import { deepEquals } from "bun";
import process from "node:process";
import { Clear, Green, Red } from "../cli";

console.time("test");

let TrueAsserts: number = 0;
let FalseAsserts: number = 0;

const updateCounters = (value: boolean): number => value
  ? TrueAsserts += 1 : FalseAsserts += 1;

const assert = (value: boolean): boolean => {
  updateCounters(value);
  if (!value) console.error("Error");
  return value;
}

const assertIs = <T>(given: T, expected: T): boolean => {
  const value = given == expected;
  updateCounters(value);
  if (!value) {
    console.error(`Error: expected ${expected}`);
    console.error(`       received ${given}`);
  }
  return value;
}

const assertEq = <T>(given: T, expected: T): boolean => {
  const value = deepEquals(given, expected);
  updateCounters(value);
  if (!value) {
    console.error("Error: expected", expected);
    console.error("       received", given);
  }
  return value;
};

const assertStats = () => {
  console.log(
    `${FalseAsserts == 0 ? Green : Red}${TrueAsserts} / ${TrueAsserts + FalseAsserts} asserts true${Clear} ` +
    `(${(performance.now() | 0) / 1000} seconds)`);
  console.timeEnd("test");
  if (FalseAsserts != 0) process.exitCode = FalseAsserts;
  if (process.exitCode && process.exitCode != 0)
    console.log(`${Red}Test failed ${process.exitCode}${Clear}`);
}

const fail = (): number => process.exitCode = -1;

process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);
process.on("exit", assertStats);

export {
  assert,
  assertEq,
  assertIs
};

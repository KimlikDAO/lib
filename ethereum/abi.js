import { Address } from "./address.d";

/**
 * @param {Address} addr Ethereum address
 * @return {string} The address formatted for calldata.
 */
const address = (addr) => "0".repeat(24) + addr.slice(2);

/**
 * @param {Address} addr Ethereum address
 * @return {string} The address formatted as abi.encodePacked(address).
 */
const packedAddress = (addr) => addr.slice(2);

/**
 * @param {number | bigint} num
 * @return {string}
 */
const uint256 = (num) => num.toString(16).padStart(64, "0");

/** @const {(num: number) => string} */
const uint160 = (num) => num.toString(16).padStart(40, "0");

/** @const {(num: number) => string} */
const uint96 = (num) => num.toString(16).padStart(24, "0");

/** @const {(num: number) => string} */
const uint64 = (num) => num.toString(16).padStart(16, "0");

/**
 * @param {string} value
 * @return {boolean}
 */
const isZero = (value) => value == "0x" || value.replaceAll("0", "") == 'x';

const isNonzero = (value) => !isZero(value);

/**
 * We need the pureOrBreakMyCode annotation since repeat is not inferred
 * to be pure due to polyfills.
 * @see https://github.com/google/closure-compiler/issues/4018
 * @const {string}
 */
const Uint256Max = /** @pureOrBreakMyCode */("f".repeat(64));

export default {
  address,
  isNonzero,
  isZero,
  packedAddress,
  uint160,
  uint256,
  uint64,
  uint96,
  Uint256Max,
}

import { PureExpr } from "@kimlikdao/kdts";
import { Address } from "./address.d";

/** @satisfies {PureFn} */
const address = (addr: Address): string =>
  "0".repeat(24) + addr.slice(2);

/** @satisfies {PureFn} */
const packedAddress = (addr: Address): string => addr.slice(2);

/**
 * Serializes a given value as `uint256`. Can accept number, bigint, or string
 * parseable by BigInt (e.g. "0x1", "123").
 *
 * @satisfies {PureFn}
 */
const uint256 = (value: number | bigint | string): string => {
  return (typeof value == "string" ? BigInt(value) : value)
    .toString(16).padStart(64, "0");
};

/** @satisfies {PureFn} */
const uint160 = (num: number): string =>
  num.toString(16).padStart(40, "0");

/** @satisfies {PureFn} */
const uint96 = (num: number): string =>
  num.toString(16).padStart(24, "0");

/** @satisfies {PureFn} */
const uint64 = (num: number): string =>
  num.toString(16).padStart(16, "0");

/** @satisfies {PureFn} */
const isZero = (value: string): boolean =>
  value == "0x" || value.replaceAll("0", "") == "x";

/** @satisfies {PureFn} */
const isNonzero = (value: string): boolean => !isZero(value);

/**
 * We need the PureExpr marker here since repeat is not inferred to be pure due
 * to polyfills of the gcc backend.
 * @see https://github.com/google/closure-compiler/issues/4018
 */
const Uint256Max = "f".repeat(64) satisfies PureExpr;

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
};

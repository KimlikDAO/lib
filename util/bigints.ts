import hex from "./hex";

/**
 * Writes `n` as bytes in little-endian value order into `bytes`, but fills the
 * destination from right to left (decreasing indices), starting just before
 * `start`.
 *
 * This is convenient when reserving a fixed-width suffix in a buffer while
 * keeping the numeric representation little-endian.
 *
 * @example
 * ```ts
 * const out = new Uint8Array(6);
 * // n = 0x123456 -> LE bytes [0x56, 0x34, 0x12]
 * const first = intoBytesBE(out, 0x123456n, 5);
 * // out is now [0, 0, 0x12, 0x34, 0x56, 0]
 * // first == 2 (index of first written byte)
 * ```
 * @satisfies {InPlaceFn}
 */
const intoBytesBE = (
  bytes: Uint8Array | number[],
  n: bigint | number,
  start: number
): number => {
  const str = n.toString(16);
  let j = start - 1;
  for (let i = str.length; i > 0; --j, i -= 2)
    bytes[j] = parseInt(str.substring(i - 2, i), 16);
  return j + 1;
};

/**
 * Writes `n` as bytes in little-endian value order into `bytes`, filling from
 * left to right (increasing indices), starting at `start`.
 *
 * Useful when appending LE integers directly into protocol buffers.
 *
 * @example
 * ```ts
 * const out = new Uint8Array(6);
 * // n = 0x123456 -> LE bytes [0x56, 0x34, 0x12]
 * intoBytesLE(out, 0x123456n, 1);
 * // out is now [0, 0x56, 0x34, 0x12, 0, 0]
 * ```
 * @satisfies {InPlaceFn}
 */
const intoBytesLE = (
  bytes: Uint8Array | number[],
  n: bigint | number,
  start = 0
): void => {
  const str = n.toString(16);
  for (let i = str.length, j = start; i > 0; i -= 2, ++j)
    bytes[j] = parseInt(str.substring(i - 2, i), 16);
};

/** @satisfies {PureFn} */
const fromBytesBE = (bytes: Uint8Array): bigint => BigInt("0x" + hex.from(bytes));

/** @satisfies {PureFn} */
const fromBytesLE = (bytes: Uint8Array | number[]): bigint =>
  BigInt("0x" + hex.fromBytesLE(bytes));

/** @satisfies {SideEffectFreeFn} */
const random = (bits: number): bigint => BigInt("0x" +
  hex.from(crypto.getRandomValues(new Uint8Array((bits + 7) / 8 | 0)) as Uint8Array));

export default {
  intoBytesBE,
  intoBytesLE,
  fromBytesBE,
  fromBytesLE,
  random,
};

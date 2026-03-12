import hex from "./hex";

/** @modifies {arguments} */
const intoBytesBE = (bytes: Uint8Array | number[], idx: number, n: bigint | number): number => {
  const str = (n as bigint).toString(16);
  --idx;
  for (let i = str.length; i > 0; --idx, i -= 2)
    bytes[idx] = parseInt(str.substring(i - 2, i), 16);
  return idx + 1;
};

/** @modifies {arguments} */
const intoBytesLE = (bytes: Uint8Array | number[], n: bigint | number): void => {
  const str = (n as bigint).toString(16);
  for (let i = str.length, j = 0; i > 0; i -= 2, ++j)
    bytes[j] = parseInt(str.substring(i - 2, i), 16);
};

/** @pure */
const fromBytesBE = (bytes: Uint8Array): bigint => BigInt("0x" + hex.from(bytes));

/** @pure */
const fromBytesLE = (bytes: Uint8Array | number[]): bigint => BigInt("0x" + hex.fromBytesLE(bytes));

/** @nosideeffects */
const random = (size: number): bigint =>
  BigInt("0x" + hex.from(crypto.getRandomValues(new Uint8Array(size)) as Uint8Array));

export default {
  intoBytesBE,
  intoBytesLE,
  fromBytesBE,
  fromBytesLE,
  random,
};

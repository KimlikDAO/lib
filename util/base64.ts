import hex from "./hex";

/** @pure */
const from = (bytes: Uint8Array): string => bytes.toBase64();

// TODO(KimlikDAO-bot): consider toString(8) route.
/** @pure */
const fromBigInt = (n: bigint): string => from(hex.toUint8Array(n.toString(16)));

/** @pure */
const toBytes = (base64: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.fromBase64(base64);

/** @pure */
const toBigInt = (base64: string): bigint =>
  BigInt("0x" + hex.from(toBytes(base64)));

/** @modifies {arguments} */
const intoBytes = (bytes: Uint8Array, base64: string): void => {
  bytes.setFromBase64(base64);
};

export default {
  fromBigInt,
  from,
  toBigInt,
  toBytes,
  intoBytes,
};

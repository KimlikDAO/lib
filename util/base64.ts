import hex from "./hex";

/** @satisfies {PureFn} */
const from = (bytes: Uint8Array): string => bytes.toBase64();

// TODO(KimlikDAO-bot): consider toString(8) route.
/** @satisfies {PureFn} */
const fromBigInt = (n: bigint): string => from(hex.toUint8Array(n.toString(16)));

/** @satisfies {PureFn} */
const toBytes = (base64: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.fromBase64(base64);

/** @satisfies {PureFn} */
const toBigInt = (base64: string): bigint =>
  BigInt("0x" + hex.from(toBytes(base64)));

/** @satisfies {InPlaceFn} */
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

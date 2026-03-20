import { PureExpr } from "../kdts/kdts.d";

/** @noinline */
const FromUint4 = "0123456789abcdef";

const FromUint8: readonly string[] = (
  (): string[] => {
    const arr: string[] = Array(256);
    for (let i = 0; i < 256; ++i)
      arr[i] = FromUint4[i >> 4] as string + FromUint4[i & 15];
    return arr;
  })() satisfies PureExpr;

const ToBinary: Record<string, string> = (
  (): Record<string, string> => {
    const toBinary: Record<string, string> = {};
    for (let i = 0; i < 16; ++i) {
      const h: string = FromUint4[i];
      toBinary[h.toUpperCase()] = toBinary[h] = i.toString(2).padStart(4, "0");
    }
    return toBinary;
  })() satisfies PureExpr;

/** @pure */
const toBinary = (hexStr: string): string =>
  Array.from(hexStr, (s: string) => ToBinary[s]).join("");

/** @pure */
const from = (bytes: Uint8Array): string => bytes.toHex();

/** @pure */
const toUint8Array = (str: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.fromHex(str.length & 1 ? "0" + str : str);

/** @pure */
const fromBytesLE = (bytes: Uint8Array | number[]): string => {
  /** @const {number} */
  const n = bytes.length;
  const octets: string[] = Array(n);
  for (let i = n; i > 0; --i)
    octets[n - i] = FromUint8[bytes[i - 1]];
  return octets.join("");
}

/** @pure */
const fromUint32ArrayBE = (words: Uint32Array): string => {
  const n = 4 * words.length;
  const octets: string[] = Array(n);
  for (let i = 0, j = 0; i < n; i += 4, ++j) {
    octets[i + 0] = FromUint8[words[j] >>> 24];
    octets[i + 1] = FromUint8[(words[j] >>> 16) & 255];
    octets[i + 2] = FromUint8[(words[j] >>> 8) & 255];
    octets[i + 3] = FromUint8[words[j] & 255];
  }
  return octets.join("");
}

/** @modifies {arguments} */
const intoBytes = (bytes: Uint8Array | number[], str: string): void => {
  const n = str.length;
  for (let i = -(n & 1), j = 0; i < n; ++j, i += 2)
    bytes[j] = parseInt(str.substring(i, i + 2), 16);
}

/** @modifies {arguments} */
const intoUint32ArrayBE = (
  words: Uint32Array | number[],
  length: number,
  str: string
): void => {
  for (let i = str.length - 8, j = length - 1; i >= 0; --j, i -= 8)
    words[j] = parseInt(str.slice(i, i + 8), 16);
}

export default {
  FromUint8,
  from,
  fromBytesLE,
  fromUint32ArrayBE,
  intoBytes,
  intoUint32ArrayBE,
  toBinary,
  toUint8Array,
};

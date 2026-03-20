import { hash } from "bun";
import { Hash, StrHash } from "./hash.d";

const Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const StrHashLength = 8;
const CharMask = 63;
const Pow12 = 2 ** 12;
const Pow24 = 2 ** 24;
const Pow36 = 2 ** 36;
const Pow48 = 2 ** 48;
const HashMask = 0xffffffffffffn;

const CharToIndex = new Int16Array(128).fill(-1);
for (let i = 0; i < Alphabet.length; ++i)
  CharToIndex[Alphabet.charCodeAt(i)] = i;

const ChunkToStr = new Array<string>(Pow12);
for (let i = 0; i < Pow12; ++i)
  ChunkToStr[i] = Alphabet[i >> 6] + Alphabet[i & CharMask];

const decodeChunk = (strHash: StrHash, i: number): number => {
  const hiCode = strHash.charCodeAt(i);
  const loCode = strHash.charCodeAt(i + 1);
  if (hiCode >= CharToIndex.length || loCode >= CharToIndex.length)
    return -1;

  const hi = CharToIndex[hiCode];
  const lo = CharToIndex[loCode];
  return hi < 0 || lo < 0 ? -1 : hi * 64 + lo;
};

const from = (data: Uint8Array | string): Hash =>
  Number((hash(data) as bigint) & HashMask);

const fromStrHash = (strHash: StrHash): Hash => {
  if (strHash.length != StrHashLength)
    return -1;
  const chunk0 = decodeChunk(strHash, 0);
  const chunk1 = decodeChunk(strHash, 2);
  const chunk2 = decodeChunk(strHash, 4);
  const chunk3 = decodeChunk(strHash, 6);
  if (chunk0 < 0 || chunk1 < 0 || chunk2 < 0 || chunk3 < 0)
    return -1;
  return chunk0 * Pow36
    + chunk1 * Pow24
    + chunk2 * Pow12
    + chunk3;
};

const add = (a: Hash, b: Hash): Hash => {
  const sum = a + b;
  return sum < Pow48 ? sum : sum - Pow48;
};

const toStr = (value: Hash): StrHash => {
  let rest = value;
  const chunk0 = rest / Pow36 | 0;
  rest -= chunk0 * Pow36;
  const chunk1 = rest / Pow24 | 0;
  rest -= chunk1 * Pow24;
  const chunk2 = rest / Pow12 | 0;
  rest -= chunk2 * Pow12;
  return ChunkToStr[chunk0]
    + ChunkToStr[chunk1]
    + ChunkToStr[chunk2]
    + ChunkToStr[rest];
};

export default {
  from,
  fromStrHash,
  add,
  toStr
};

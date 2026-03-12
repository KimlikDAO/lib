import { IC, g as sha256F } from "../crypto/sha2";
import base58 from "../util/base58";
import bigints from "../util/bigints";

/**
 * Given a buffer, adds a checksum to the last 4 bytes and returns the base58
 * encoding of the whole buffer.
 * @pure
 */
const encode = (buff: Uint8Array): string => {
  addChecksum(buff);
  return base58.from(buff);
}

/**
 * TODO(KimlikDAO-bot): Validate the checksum
 * @pure
 */
const decode = (data: string): Uint8Array => base58.toBytes(data);

/**
 * Parses a private key from Mina encoded base58 string. It does not validate
 * the checksum.
 * @pure
 */
const parsePrivateKey = (privateKey: string): bigint =>
  bigints.fromBytesLE(base58.toBytes(privateKey).subarray(2, 34));

/**
 * Given a buffer of length `n`, fills the last 4 bytes with the checksum.
 * @modifiesParamsOnly
 */
const addChecksum = (buff: Uint8Array) => {
  const n = buff.length - 4;
  const s = new Uint32Array(IC as number[]);
  const t = new Uint32Array(64);
  buff[n] = 128;
  let j = 0;
  for (let end = n + 3, i = 0; i < end; i += 4) {
    t[j] = (buff[i + 0] << 24) | (buff[i + 1] << 16) | (buff[i + 2] << 8) | buff[i + 3];
    if (j > 14) {
      sha256F(s, t);
      j = 0;
    } else ++j;
  }
  t.fill(0, j, 15);
  t[15] = n << 3;
  sha256F(s, t);
  t.set(s);
  t.fill(0, 9, 15);
  t[8] = 1 << 31;
  t[15] = 256;
  s.set(IC as number[]);
  sha256F(s, t);
  const v = s[0];
  buff[n + 3] = v & 255;
  buff[n + 2] = (v >> 8) & 255;
  buff[n + 1] = (v >> 16) & 255;
  buff[n + 0] = (v >> 24) & 255;
}

export { 
  encode,
  decode,
  parsePrivateKey,
 };

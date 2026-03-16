import { IC, g as sha256F } from "../crypto/sha2";
import base58 from "../util/base58";
import bigints from "../util/bigints";

/**
 * Given a buffer, adds a checksum to the last 4 bytes and returns the base58
 * encoding of the whole buffer.
 * @modifies {arguments}
 */
const encode = (buff: Uint8Array): string => {
  const n = buff.length;
  buff[n - 3] = buff[n - 2] = buff[n - 1] = 0;
  buff[n - 4] = 128;
  const c = checksum(buff);
  buff[n - 1] = c & 0xff;
  buff[n - 2] = (c >>> 8) & 0xff;
  buff[n - 3] = (c >>> 16) & 0xff;
  buff[n - 4] = c >>> 24;
  return base58.from(buff);
}

/**
 * Given a base58 encoded string, decodes the buffer and validates the checksum.
 * @pure
 */
const decode = (data: string): Uint8Array => {
  const buff = base58.toBytes(data);
  const n = buff.length;
  const stored = ((buff[n - 4] << 24) | (buff[n - 3] << 16)
    | (buff[n - 2] << 8) | buff[n - 1]) >>> 0;
  buff[n - 1] = buff[n - 2] = buff[n - 3] = 0;
  buff[n - 4] = 128;
  if (stored != checksum(buff)) throw "mina decode error";
  return buff;
}

/**
 * Parses a private key from Mina encoded base58 string.
 *
 * @pure
 */
const parsePrivateKey = (privateKey: string): bigint =>
  bigints.fromBytesLE(decode(privateKey).subarray(2, 34));

/**
 * Given a buffer of length `n` ending with [128, 0, 0, 0], computes a checksum
 * from all but the last 4 bytes.
 * @pure
 */
const checksum = (buff: Uint8Array): number => {
  const m = buff.length - 4;
  const s = new Uint32Array(IC as number[]);
  const t = new Uint32Array(64);
  let j = 0;
  for (let end = m + 3, i = 0; i < end; i += 4) {
    t[j] = (buff[i + 0] << 24) | (buff[i + 1] << 16) | (buff[i + 2] << 8) | buff[i + 3];
    if (j > 14) {
      sha256F(s, t);
      j = 0;
    } else ++j;
  }
  t.fill(0, j, 15);
  t[15] = m << 3;
  sha256F(s, t);
  t.set(s);
  t.fill(0, 9, 15);
  t[8] = 1 << 31;
  t[15] = 256;
  s.set(IC as number[]);
  sha256F(s, t);
  return s[0];
}

export {
  encode,
  decode,
  parsePrivateKey,
};

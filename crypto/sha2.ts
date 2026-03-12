/**
 * @author KimlikDAO
 */

// Initial constants
const IC: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
];

// Round constants for each of the 64 rounds.
const RC: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

/**
 * Given a Uint32Array of length at most 2^32 - 1, outputs the sha256
 * as a Uint32Array of length 8.
 * @pure
 */
const sha256Uint32 = (words: Uint32Array): Uint32Array => {
  const n = words.length;
  const s = new Uint32Array(IC as number[]);
  const t = new Uint32Array(64);
  let i = 0;
  for (const end = n - 15; i < end; i += 16) {
    t.set(words.subarray(i, i + 16))
    g(s, t);
  }
  t.set(words.subarray(i));
  i = n - i;
  t[i] = 1 << 31;
  if (i > 13) {
    if (i == 14) t[15] = 0;
    g(s, t);
    t.fill(0, 0, 14);
  } else
    t.fill(0, i + 1, 14);
  t[14] = n >>> 27;
  t[15] = n << 5;
  g(s, t);
  return s;
}

/**
 * Extends the first 16 words into the remaining 48 words w[16..63] of the
 * message schedule array.
 * @modifiesParamsOnly
 */
const extend = (t: Uint32Array): void => {
  for (let i = 16, t1, s0, s1; i < 64; ++i) {
    t1 = t[i - 15];
    s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
    t1 = t[i - 2];
    s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
    t[i] = t[i - 16] + s0 + t[i - 7] + s1 << 0;
  }
}

/**
 * The sha256 compression function, implemented 1:1 without loop unrolling.
 * @modifiesParamsOnly
 */
const g = (s: Uint32Array, t: Uint32Array): void => {
  extend(t);
  let [a, b, c, d, e, f, g, h] = s;
  for (let i = 0, s0, s1, t1, ch, maj; i < 64; ++i) {
    s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    ch = (e & f) ^ (~e & g);
    t1 = h + s1 + ch + RC[i] + t[i];
    maj = (a & b) ^ (a & c) ^ (b & c);
    h = g; g = f; f = e; e = d + t1 << 0;
    d = c; c = b; b = a; a = t1 + s0 + maj << 0;
  }
  s[0] += a; s[1] += b; s[2] += c; s[3] += d;
  s[4] += e; s[5] += f; s[6] += g; s[7] += h;
}

/**
 * Computes HMAC-SHA256 for a key of length at most 16 words (64 bytes).
 * @pure
 */
const hmacUint32 = (key: Uint32Array, message: Uint32Array): Uint32Array => {
  const m = key.length;
  const inner = new Uint32Array(16 + message.length);
  const outer = new Uint32Array(16 + 8);

  for (let i = 0; i < m; ++i) {
    inner[i] = key[i] ^ 0x36363636;
    outer[i] = key[i] ^ 0x5c5c5c5c;
  }
  inner.fill(0x36363636, m, 16);
  inner.set(message, 16);
  outer.fill(0x5c5c5c5c, m, 16);
  outer.set(sha256Uint32(inner), 16);
  return sha256Uint32(outer);
};

export {
  IC,
  RC,
  g,
  hmacUint32,
  sha256Uint32
};

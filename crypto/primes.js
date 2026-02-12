/**
 * @fileoverview Tools for prime numbers and almost prime numbers.
 *
 * @author KimlikDAO
 */

import { exp2 } from "./modular";

/**
 * First 499 odd primes.
 *
 * @const {number[]} */
const OddPrimes = [
  3, 5, 7, 11, 13, 17, 19, 23, 29,
  31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
  127, 131, 137, 139, 149, 151, 157, 163, 167, 173,
  179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
  233, 239, 241, 251, 257, 263, 269, 271, 277, 281,
  283, 293, 307, 311, 313, 317, 331, 337, 347, 349,
  353, 359, 367, 373, 379, 383, 389, 397, 401, 409,
  419, 421, 431, 433, 439, 443, 449, 457, 461, 463,
  467, 479, 487, 491, 499, 503, 509, 521, 523, 541,
];

/**
 * Performs a single round of Miller-Rabin test to the base 2.
 *
 * @param {bigint} N
 * @param {bigint} d It should satisfy d.2^s = N
 * @param {number} s
 * @return {boolean}
 */
const millerRabinBase2 = (N, d, s) => {
  if (N == 3n) return true;
  /** @type {bigint} */
  let x = exp2(d, N);
  if (x == 1n || x == N - 1n) return true;

  for (let r = 1; r < s; ++r) {
    x = x * x % N;
    if (x == 1n) return false;
    if (x == N - 1n) return true;
  }
  return false;
}

/**
 * @param {string} seed Random seed for the non-smooth number generation.
 *                      A hex string of 64 characters.
 * @return {bigint}
 */
const getNonsmooth = (seed) => {
  /**
   * The most significant 244 bits of the generated number are from the seed.
   * The rest will be chosen by a search.
   *
   * @const {bigint}
   */
  const h = BigInt(`0x${seed}000`);

  /**
   * Bit vector to keep the sieve results.
   *
   * `t[i] == 1` implies that `h.2^k + 2i + 1` is composite.
   *
   * @const {Uint8Array}
   */
  const t = new Uint8Array(4096);
  for (const p of OddPrimes) {
    /** @type {number} */
    let i = (p - Number(h % BigInt(p)) - 1) * ((p + 1) >> 1) % p;
    for (; i < 4096; i += p)
      t[i] = 1;
  }

  for (let i = 1; i < 4096; ++i) {
    while (t[i]) ++i;
    /** @type {number} */
    let s = 1;
    /** @type {number} */
    let j = i;
    for (; (j & 1) == 0; j >>= 1) ++s;
    /** @const {bigint} */
    const d = (h >> BigInt(s)) + BigInt(j);
    /** @const {bigint} */
    const N = h + BigInt(2 * i + 1);

    if (millerRabinBase2(N, d, s))
      return N;
  }
  let i = 0;
  while (t[i]) ++i;
  return h + BigInt(2 * i + 1);
}

export { getNonsmooth, millerRabinBase2, OddPrimes };

import hex from "../util/hex";
import { expTimesExp } from "./modular";
import { getNonsmooth } from "./primes";
import { keccak256Uint32ToHex } from "./sha3";

/** @noinline */
const N = 0xe0b7782dbd6c9fc269cc5259ca7be1b451c9fbbc20293434852f6f3e8603460932b66001276a399f2e20dc942c627159b28652138463e1fc59446d8715ae651cff6823ba0a6202d12f34b4ca06d6ae6cecd7b9962df8380a5469b79145c8b433d493d82aeb28a0305bf0c766377f005fd5de2d3594867116237c5c40fd542575n;

/**
 * Generates a challenge supposedly sent from the verifier to the prover.
 *
 * Thanks to the Fiat-Shamir heuristic, the prover generates this from an
 * unpredictable function of the VDF output without any interaction.
 *
 * @param gArr A Uint32Array of length 8 with a buffer of at least 40 words.
 * @pure
 */
const generateChallenge = (gArr: Uint32Array, yArr: Uint32Array): bigint => {
  /**
   * We use the fact that gArr comes with a buffer of >= 40 uint32's of which
   * only the first 8 are used.
   */
  const buff = new Uint32Array(gArr.buffer, 0, 40);
  buff.set(yArr, 8);
  return getNonsmooth(keccak256Uint32ToHex(buff).slice(3));
}

/** @pure */
const evaluate = (
  gArr: Uint32Array, t: number
): {
  y: Uint32Array,
  π: bigint,
  l: bigint
} => {
  const g = BigInt("0x" + hex.from(new Uint8Array(gArr.buffer, 0, 32)));
  let y = g;
  for (let i = 0; i < t; ++i)
    y = y * y % N;
  const yArr = new Uint32Array(32);
  hex.intoUint32ArrayBE(yArr, 32, y.toString(16));
  const l = generateChallenge(gArr, yArr);
  let π = 1n;
  for (let i = 0, r = 2n; i < t; ++i, r <<= 1n) {
    π = π * π % N;
    if (r >= l) {
      π = π * g % N;
      r -= l;
    }
  }
  return { y: yArr, π, l }
}

/**
 * Reconstructs y from the paramters logT, gArr, π, l.
 * @pure
 */
const reconstructY = (
  logT: number,
  gArr: Uint32Array,
  π: bigint,
  l: bigint
): Uint32Array => {
  const g = BigInt("0x" + hex.from(new Uint8Array(gArr.buffer, 0, 32)));
  let r = 2n;
  for (let i = 0; i < logT; ++i)
    r = (r * r) % l;
  const y = expTimesExp(π, l, g, r, N);
  const yArr = new Uint32Array(32);
  hex.intoUint32ArrayBE(yArr, 32, y.toString(16));
  return yArr;
}

export {
  evaluate,
  generateChallenge,
  reconstructY
};

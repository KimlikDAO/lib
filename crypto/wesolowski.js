import { hex, uint32ArrayeHexten } from "../util/çevir";
import { expTimesExp } from "./modular";
import { getNonsmooth } from "./primes";
import { keccak256Uint32ToHex } from "./sha3";

/**
 * @noinline
 * @const {bigint}
 */
const N = 0xe0b7782dbd6c9fc269cc5259ca7be1b451c9fbbc20293434852f6f3e8603460932b66001276a399f2e20dc942c627159b28652138463e1fc59446d8715ae651cff6823ba0a6202d12f34b4ca06d6ae6cecd7b9962df8380a5469b79145c8b433d493d82aeb28a0305bf0c766377f005fd5de2d3594867116237c5c40fd542575n;

/**
 * Generates a challenge supposedly sent from the verifier to the prover.
 *
 * Thanks to the Fiat-Shamir heuristic, the prover generates this from an
 * unpredictable function of the VDF output without any interaction.
 *
 * @param {!Uint32Array} gArr A Uint32Array of length 8 with a buffer of length
 *                            at least 40 words (160 bytes).
 * @param {!Uint32Array} yArr
 * @return {bigint}
 */
const generateChallenge = (gArr, yArr) => {
  /**
   * We use the fact that gArr comes with a buffer of >= 40 uint32's of which
   * only the first 8 are used.
   *
   * @const {!Uint32Array}
   */
  const buff = new Uint32Array(gArr.buffer, 0, 40);
  buff.set(yArr, 8);
  return getNonsmooth(keccak256Uint32ToHex(buff).slice(3));
}

/**
 * @param {!Uint32Array} gArr
 * @param {number} t
 * @return {{
 *   y: !Uint32Array,
 *   π: bigint,
 *   l: bigint
 * }}
 */
const evaluate = (gArr, t) => {
  /**
   * (0) Convert gArr to bigint.
   *
   * @const {bigint}
   */
  const g = BigInt("0x" + hex(new Uint8Array(gArr.buffer, 0, 32)));

  /**
   * (1) Calculate y = g^{2^t} (mod N)
   *
   * @type {bigint}
   */
  let y = g;
  for (let i = 0; i < t; ++i)
    y = y * y % N;
  /** @const {!Uint32Array} */
  const yArr = new Uint32Array(32);
  uint32ArrayeHexten(yArr, y.toString(16).padStart(256, "0"));

  /**
   * (2) Generate the challenge l = generateChallenge(gArr, yArr).
   *
   * @const {bigint}
   */
  const l = generateChallenge(gArr, yArr);

  /**
   * (2) Construct the proof π = g^{⌊2^t / l⌋}
   *
   * @type {bigint}
   */
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
 * Reconstructs y from the paramters:
 *
 * @param {number} logT the logarithm of the difficulty parameter t
 * @param {!Uint32Array} gArr the input to the VDF
 * @param {bigint} π the Wesolowski proof for the challenge l,
 * @param {bigint} l the challenge generated from a secure hash of g, y.
 * @return {!Uint32Array} y reconstructred
 */
const reconstructY = (logT, gArr, π, l) => {
  /** @const {bigint} */
  const g = BigInt("0x" + hex(new Uint8Array(gArr.buffer, 0, 32)));
  /** @type {bigint} */
  let r = 2n;
  for (let i = 0; i < logT; ++i)
    r = (r * r) % l;
  /** @const {bigint} */
  const y = expTimesExp(π, l, g, r, N);
  /** @const {!Uint32Array} */
  const yArr = new Uint32Array(32);
  uint32ArrayeHexten(yArr, y.toString(16).padStart(256, "0"));
  return yArr;
}

export {
  evaluate,
  generateChallenge,
  reconstructY
};

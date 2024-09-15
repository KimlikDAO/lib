import { P } from "./minaPoseidon";

/**
 * R = 2^255
 * M = R - 1
 *
 * @noinline
 * @const {bigint}
 */
const M = (1n << 255n) - 1n;
/**
 * @noinline
 * @const {bigint}
 */
const MinusRmodP = 0x448d31f81299f237325a61da00000002n;
/**
 * @noinline
 * @const {bigint}
 */
const InvRmodP = 0x3e389fe3c44f1aae196532ddf9134cb36f8dbd877a2ff940551ec21a74ed351n;
/**
 * S = -1 / P mod R
 *
 * @noinline
 * @const {bigint}
 */
const S = 0x7c713fc7889e355c32ca65bbf22699669c760bd82a13db2992d30ecffffffffn;

/** @typedef {bigint} */
const montint = {};

/**
 * @param {montint} a
 * @param {montint} b
 * @return {montint}
 */
const mul = (a, b) => {
  /** @const {bigint} */
  const t = a * b;
  /** @const {bigint} */
  const u = ((t & M) * S) & M;
  return (t + u * P) >> 255n;
}

/**
 * @param {bigint} n 
 * @return {montint} 
 */
const mont = (n) => P - (n * MinusRmodP % P);

/**
 * @param {montint} i 
 * @return {bigint} 
 */
const unmont = (i) => i * InvRmodP % P;

export { mont, montint, mul, P, S, unmont };

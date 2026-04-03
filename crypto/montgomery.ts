import { LargeConstant } from "@kimlikdao/kdts";
import { P } from "./minaPoseidon";

/**
 * R = 2^255
 * M = R - 1
 */
const M = (1n << 255n) - 1n satisfies LargeConstant;

const MinusRmodP = 0x448d31f81299f237325a61da00000002n satisfies LargeConstant;
const InvRmodP = 0x3e389fe3c44f1aae196532ddf9134cb36f8dbd877a2ff940551ec21a74ed351n satisfies LargeConstant;
/** S = -1 / P mod R */
const S = 0x7c713fc7889e355c32ca65bbf22699669c760bd82a13db2992d30ecffffffffn satisfies LargeConstant;

type montint = bigint;

const mul = (a: montint, b: montint): montint => {
  const t = a * b;
  const u = ((t & M) * S) & M;
  return (t + u * P) >> 255n;
}

const mont = (n: bigint): montint => P - (n * MinusRmodP % P);

const unmont = (i: montint): bigint => i * InvRmodP % P;

export {
  M,
  mont,
  montint,
  mul,
  P,
  S,
  unmont
};

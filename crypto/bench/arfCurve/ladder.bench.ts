import bigints from "../../../util/bigints";
import { bench } from "../../../util/testing/bench";
import { Point } from "../../ellipticCurve";
import { G, Q, Secp256k1 } from "../../secp256k1";

const O: Point = Secp256k1.O;

const multiplyBitIntMask = (R: Point, k: bigint): Point => {
  const A = O.copy();
  while (k > 0n) {
    if (k & 1n) A.increment(R);
    R.double();
    k >>= 1n;
  }
  return A;
};

const ladderBigInt = (k: bigint): Point => {
  const R = multiplyBitIntMask(G.copy(), k);
  const S = multiplyBitIntMask(G.copy(), Q - k);
  R.increment(S);
  return R;
};

const ladderString = (k: bigint): Point => {
  const R = G.copy().multiply(k);
  const S = G.copy().multiply(Q - k);
  R.increment(S);
  return R;
};

const kMid = bigints.random(32) % Q;
const kRand1 = bigints.random(32) % Q;
const kRand2 = bigints.random(32) % Q;

bench("Scalar ladder: bigint (bit) vs string (base-4 multiply)", {
  "ladder bigint (bit mask)": ladderBigInt,
  "ladder string (multiply / base-4)": ladderString,
}, {
  repeat: 30,
  dataset: [
    { args: [999n], expected: O },
    { args: [Q / 2n], expected: O },
    { args: [kMid], expected: O },
    { args: [kRand1], expected: O },
    { args: [kRand2], expected: O },
  ],
});

import { assert } from "../../testing/assert";
import { equal, G, N, O, Point } from "../secp256k1";

/**
 * @param {!Point} P
 * @param {!bigint} n
 */
const multiplyBitIntMask = (P, n) => {
  let d = P.copy();
  P.x = P.y = P.z = 0n;
  while (n > 0n) {
    if (n & 1n) P.increment(d);
    d.double();
    n >>= 1n;
  }
  return P;
}

const benchMultiplyBeginEnd = () => {
  console.time("multiply(small) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i);
    const P = G.copy().multiply(k);
    const Q = G.copy().multiply(N - k);
    P.increment(Q);

    assert(equal(P, O));
  }
  console.timeEnd("multiply(small) (1k multiply's)");
}

const testMultiply = () => {
  for (let i = 0; i < 500; ++i) {
    const k = BigInt(i) + 8098234098230498234n;
    const P = multiplyBitIntMask(G.copy(), k);
    const Q = multiplyBitIntMask(G.copy(), N - k);
    P.increment(Q);

    assert(equal(P, O));
  }
}

testMultiply();

const benchMultiplyMiddle = () => {
  /** @const {!bigint} */
  const delta = N / 2n;
  console.time("multiplyBigIntMask(N/2) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i) + delta;
    const P = multiplyBitIntMask(G.copy(), k);
    const Q = multiplyBitIntMask(G.copy(), N - k);
    P.increment(Q);

    assert(equal(P, O));
  }
  console.timeEnd("multiplyBigIntMask(N/2) (1k multiply's)");

  console.time("multiply(N/2) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i) + delta;
    const P = G.copy().multiply(k);
    const Q = G.copy().multiply(N - k);
    P.increment(Q);

    assert(equal(P, O));
  }
  console.timeEnd("multiply(N/2) (1k multiply's)");
}

benchMultiplyBeginEnd();
benchMultiplyMiddle();

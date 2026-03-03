import { assert, assertEq } from "../../testing/assert";
import { equal } from "../ellipticCurve";
import { G, O, P, Point, Q } from "../secp256k1";

/**
 * @param {Point} R
 * @param {bigint} n
 */
const multiplyBitIntMask = (R, n) => {
  let d = R.copy();
  R.x = R.y = R.z = 0n;
  while (n > 0n) {
    if (n & 1n) R.increment(d);
    d.double();
    n >>= 1n;
  }
  return R;
}

const benchMultiplyBeginEnd = () => {
  console.time("multiply(small) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i);
    const R = G.copy().multiply(k);
    const S = G.copy().multiply(Q - k);
    R.increment(S);

    assert(equal(R, O));
  }
  console.timeEnd("multiply(small) (1k multiply's)");
}

const testMultiply = () => {
  for (let i = 0; i < 500; ++i) {
    const k = BigInt(i) + 8098234098230498234n;
    const R = multiplyBitIntMask(G.copy(), k);
    const S = multiplyBitIntMask(G.copy(), Q - k);
    R.increment(S);

    assert(equal(R, O));
  }
}

testMultiply();

const benchMultiplyMiddle = () => {
  /** @const {bigint} */
  const delta = Q / 2n;
  console.time("multiplyBigIntMask(N/2) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i) + delta;
    const R = multiplyBitIntMask(G.copy(), k);
    const S = multiplyBitIntMask(G.copy(), Q - k);
    R.increment(S);

    assert(equal(R, O));
  }
  console.timeEnd("multiplyBigIntMask(N/2) (1k multiply's)");

  console.time("multiply(N/2) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i) + delta;
    const R = G.copy().multiply(k);
    const S = G.copy().multiply(Q - k);
    R.increment(S);

    assert(equal(R, O));
  }
  console.timeEnd("multiply(N/2) (1k multiply's)");
}

/**
 * @param {bigint} n
 * @return {bigint}
 */
const sqrt1 = (n) => {
  /**
   * @param {bigint} b
   * @param {number} pow
   * @return {bigint}
   */
  const tower = (b, pow) => {
    while (pow-- > 0)
      b = b * b % P;
    return b;
  }
  const b2 = (((n * n) % P) * n) % P;
  const b3 = (b2 * b2 * n) % P;
  const b6 = (tower(b3, 3) * b3) % P;
  const b9 = (tower(b6, 3) * b3) % P;
  const b11 = (tower(b9, 2) * b2) % P;
  const b22 = (tower(b11, 11) * b11) % P;
  const b44 = (tower(b22, 22) * b22) % P;
  const b88 = (tower(b44, 44) * b44) % P;
  const b176 = (tower(b88, 88) * b88) % P;
  const b220 = (tower(b176, 44) * b44) % P;
  const b223 = (tower(b220, 3) * b3) % P;
  const t1 = (tower(b223, 23) * b22) % P;
  const t2 = (tower(t1, 6) * b2) % P;
  return tower(t2, 2);
}

/**
 * In secp256k1, P = 3 (mod 4) so the square root of n is simply n^((P+1)/4).
 * In this sqrt alternative, we compute this exponent through a standard
 * algorithm.
 *
 * @param {bigint} n
 * @return {bigint}
 */
const sqrt2 = (n) => {
  let r = 1n;
  for (let e = (P + 1n) / 4n; e > 0n; e >>= 1n) { // powMod: modular exponentiation.
    if (e & 1n) r = (r * n) % P;
    n = (n * n) % P;
  }
  return r;
}

const benchSqrt = () => {
  let a1 = 0n;
  {
    console.time("sqrt1");
    for (let i = 100n; i < 10000n; ++i)
      a1 += sqrt1(i);
    console.timeEnd("sqrt1");
  }
  let a2 = 0n;
  {
    console.time("sqrt2");
    for (let i = 100n; i < 10000n; ++i)
      a2 += sqrt2(i);
    console.timeEnd("sqrt2");
  }
  assertEq(a1, a2);
}

benchSqrt();
benchMultiplyBeginEnd();
benchMultiplyMiddle();

import { assertEq } from "../../../testing/assert";
import { Point } from "../../ellipticCurve";
import { G, Q, Secp256k1 } from "../../secp256k1";

const O: Point = new Secp256k1(0n, 0n, 0n);

const multiplyBitIntMask = (R: Point, n: bigint): Point => {
  let d = R.copy();
  R.x = R.y = R.z = 0n;
  while (n > 0n) {
    if (n & 1n) R.increment(d);
    d.double();
    n >>= 1n;
  }
  return R;
}

const testMultiply = () => {
  for (let i = 0; i < 500; ++i) {
    const k = BigInt(i) + 8098234098230498234n;
    const R = multiplyBitIntMask(G.copy(), k);
    const S = multiplyBitIntMask(G.copy(), Q - k);
    R.increment(S);

    assertEq(R, O);
  }
}

testMultiply();

const benchMultiplyBeginEnd = () => {
  console.time("multiply(small) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i);
    const R = G.copy().multiply(k);
    const S = G.copy().multiply(Q - k);
    R.increment(S);

    assertEq(R, O);
  }
  console.timeEnd("multiply(small) (1k multiply's)");
}

const benchMultiplyMiddle = () => {
  const delta = Q / 2n;
  console.time("multiplyBigIntMask(N/2) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i) + delta;
    const R = multiplyBitIntMask(G.copy(), k);
    const S = multiplyBitIntMask(G.copy(), Q - k);
    R.increment(S);

    assertEq(R, O);
  }
  console.timeEnd("multiplyBigIntMask(N/2) (1k multiply's)");

  console.time("multiply(N/2) (1k multiply's)");
  for (let i = 0; i < 1000; ++i) {
    const k = BigInt(i) + delta;
    const R = G.copy().multiply(k);
    const S = G.copy().multiply(Q - k);
    R.increment(S);

    assertEq(R, O);
  }
  console.timeEnd("multiply(N/2) (1k multiply's)");
}
benchMultiplyBeginEnd();
benchMultiplyMiddle();

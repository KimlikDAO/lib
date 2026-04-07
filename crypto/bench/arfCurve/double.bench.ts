import { LargeConstant } from "@kimlikdao/kdts";
import { bench } from "@kimlikdao/kdts/bench";
import { arfCurveFamily } from "../../arfCurve";
import { AffinePoint, Point } from "../../ellipticCurve";
import { exp2 } from "../../modular";
import { P, Q } from "../../secp256k1";

/** @satisfies {PureFn} */
const modP = (x: bigint): bigint => {
  let res = x % P;
  return res >= 0n ? res : res + P;
}

const doubleInc = (R: Point): Point => {
  const { x, y, z } = R;
  const a = (x * x) % P;
  const b = (y * y) % P;
  const c = (b * b) % P;
  const xb = x + b;
  const d = 2n * (xb * xb - a - c) % P;
  const e = 3n * a;
  const f = (e * e) % P;
  const X = modP(f - 2n * d);
  R.y = modP(e * (d - X) - 8n * c);
  R.z = (2n * y * z) % P;
  R.x = X;
  return R;
}

const doubleRight = (R: Point): Point => {
  const { x, y, z } = R;
  const x2 = (x * x) % P;
  const y2 = (y * y) % P;
  const y4 = (y2 * y2) % P;
  const _4xy2 = 4n * x * y2 % P;
  const _3x2 = 3n * x2 % P;
  const _9x4 = _3x2 * _3x2 % P;
  const X = modP(_9x4 - 2n * _4xy2);
  R.y = modP(_3x2 * (_4xy2 - X) - 8n * y4);
  R.z = (2n * y * z) % P;
  R.x = X;
  return R;
}

const doubleRight2 = (R: Point): Point => {
  const { x, y, z } = R;
  const x2 = (x * x) % P;
  const y2 = (y * y) % P;
  const y4 = (y2 * y2) % P;
  const _4xy2 = 4n * x * y2 % P;
  const _3x2 = 3n * x2 % P;
  const _9x4 = _3x2 * _3x2 % P;
  const X = (_9x4 - 2n * (_4xy2 - P)) % P;
  R.y = modP(_3x2 * (_4xy2 - X) - 8n * y4);
  R.z = (2n * y * z) % P;
  R.x = X;
  return R;
}

const doubleRightShift = (R: Point): Point => {
  const { x, y } = R;
  const x2 = x * x % P;
  const y2 = y * y % P;
  const y4 = y2 * y2 % P;
  const _4xy2 = ((x * y2) << 2n) % P;
  const _3x2 = ((x2 << 1n) + x2) % P;
  const _9x4 = _3x2 * _3x2 % P;
  R.x = modP(_9x4 - (_4xy2 << 1n));
  R.y = modP(_3x2 * (_4xy2 - R.x) - (y4 << 3n));
  R.z *= (y << 1n); R.z %= P;
  return R;
}

const doubleRightShift2 = (R: Point): Point => {
  const { x, y } = R;
  const x2 = x * x % P;
  const y2 = y * y % P;
  const y4 = y2 * y2 % P;
  const _4xy2 = ((x * y2) << 2n) % P;
  const _3x2 = 3n * x2 % P;
  const _9x4 = _3x2 * _3x2 % P;
  R.x = modP(_9x4 - (_4xy2 << 1n));
  R.y = modP(_3x2 * (_4xy2 - R.x) - (y4 << 3n));
  R.z *= y << 1n; R.z %= P;
  return R;
}

const doubleGPT = (R: Point): Point => {
  const { x, y, z } = R;
  const t1 = (y * y) % P; // S1
  const t2 = (4n * x * t1) % P; // M1
  const t1Squared = (t1 * t1) % P; // S2
  const t3 = (8n * t1Squared) % P; // Multiplication by constant
  const X1Squared = (x * x) % P; // S3
  const t4 = (3n * X1Squared) % P; // Multiplication by constant
  const t4Squared = (t4 * t4) % P; // S4
  const X3 = (t4Squared - 2n * t2 + P + P) % P; // Ensure non-negative before modulo
  const Y3 = (t4 * (t2 - X3 + P) - t3 + P) % P; // M2 and subtraction
  const Z3 = (2n * y * z) % P; // M3
  R.x = X3;
  R.y = Y3;
  R.z = Z3;
  return R;
}

const SecpFamily = arfCurveFamily(P);
const G: Point = SecpFamily.pointFromAffine({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
}) satisfies LargeConstant;
const A = G.copy().multiply(exp2(10000n, Q)).proj();

const makeFunc = (f: ((R: Point) => Point) | null): () => AffinePoint => {
  if (!f) return (): AffinePoint => {
    const H = G.copy();
    for (let i = 0; i < 10000; ++i) H.double();
    return H.proj();
  }
  return (): AffinePoint => {
    const H = G.copy();
    for (let i = 0; i < 10000; ++i) f(H);
    return H.proj();
  };
};

bench("Compare various double() formulas", {
  "double() (current implementation)": makeFunc(null),
  "doubleInc()": makeFunc(doubleInc),
  "doubleRight()": makeFunc(doubleRight),
  "doubleRight2()": makeFunc(doubleRight2),
  "doubleRightShift()": makeFunc(doubleRightShift),
  "doubleRightShift2()": makeFunc(doubleRightShift2),
  "doubleGPT()": makeFunc(doubleGPT),
}, {
  repeat: 10,
  dataset: [{
    args: [],
    expected: A,
  }],
});

import { assertEq } from "../../../testing/assert";
import { compareImpls } from "../../../testing/bench";
import { arfCurve } from "../../arfCurve";
import { Point } from "../../ellipticCurve";
import { P } from "../../secp256k1";

/** @pure */
const modP = (x: bigint): bigint => {
  let res = x % P;
  return res >= 0n ? res : res + P;
}

/**
 * Here is an incorrect "optimization".
 */
const double = (R: Point): Point => {
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

const SecpFamily = arfCurve(P);
/** @noinline */
const G: Point = SecpFamily.pointFromAffine({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
});

{
  const A = G.copy();
  const B = G.copy();
  const C = G.copy();
  const D = G.copy();
  const E = G.copy();
  const F = G.copy();
  for (let i = 0; i < 1000; ++i) {
    double(A);
    doubleRight(B);
    doubleGPT(C);
    doubleRight2(D);
    doubleRightShift(E);
    doubleRightShift2(F);
    assertEq(A, B);
    assertEq(B, C);
    assertEq(C, D);
    assertEq(D, E);
    assertEq(E, F);
  }
}

const e = () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) double(A); };
const eRight = () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleRight(A); };
const eGPT = () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleGPT(A); };
const eRight2 = () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleRight2(A); };
const eRightShift = () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleRightShift(A); };
const eRightShift2 = () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleRightShift2(A); };

compareImpls([
  e, eRight, eGPT, eRight2, eRightShift, eRightShift2,
  e, eRight, eGPT, eRight2, eRightShift, eRightShift2,
], 10, [], null);

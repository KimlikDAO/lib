import { assertEq } from "../../testing/assert";
import { compareImpls } from "../../testing/bench";
import { uint8ArrayBEtoBigInt } from "../../util/çevir";
import { arfCurve, Point as IPoint } from "../arfCurve";
import { P } from "../secp256k1";

/** @typedef {IPoint} Point */
/** @const {function(new: IPoint, bigint, bigint, bigint=)} */
const Point = arfCurve(P);

/**
 * @param {!Point} P
 * @param {bigint} n
 * @return {!Point}
 */
const multiply2 = (P, n) => {
  if (!n) {
    P.x = P.y = P.z = 0n;
  } else {
    /** @const {string} */
    const nBits = n.toString(2);
    /** @const {!Point} */
    const d = P.copy();

    for (let i = 1; i < nBits.length; ++i) {
      P.double();
      if (nBits.charCodeAt(i) == 49)
        P.increment(d);
    }
  }
  return P;
}

/** @const {!Point} */
const O = /** @type {!Point} */({ x: 0n, y: 0n, z: 0n });

/**
 * @param {!Point} P
 * @param {bigint} n
 * @return {!Point}
 */
const multiply4 = (P, n) => {
  if (!n) {
    P.x = P.y = P.z = 0n;
  } else {
    /** @const {string} */
    const nNibbles = n.toString(4);
    const P2 = P.copy().double();
    const P3 = P2.copy().increment(P);
    /** @const {!Array<!Point>} */
    const d = [O, P.copy(), P2, P3];
    ({ x: P.x, y: P.y, z: P.z } = d[nNibbles.charCodeAt(0) - 48]);
    for (let i = 1; i < nNibbles.length; ++i) {
      P.double(); P.double();
      P.increment(d[nNibbles.charCodeAt(i) - 48]);
    }
  }
  return P;
}

/**
 * @param {!Point} P
 * @param {bigint} n
 * @return {!Point}
 */
const multiply8 = (P, n) => {
  if (!n) {
    P.x = P.y = P.z = 0n;
  } else {
    /** @const {string} */
    const nNibbles = n.toString(8);
    const P2 = P.copy().double();
    const P3 = P2.copy().increment(P);
    const P4 = P2.copy().double();
    /** @const {!Array<!Point>} */
    const d = [
      O, P.copy(), P2, P3, P4, P4.copy().increment(P),
      P4.copy().increment(P2), P3.copy().increment(P4)
    ];
    ({ x: P.x, y: P.y, z: P.z } = d[nNibbles.charCodeAt(0) - 48]);
    for (let i = 1; i < nNibbles.length; ++i) {
      P.double(); P.double(); P.double();
      P.increment(d[nNibbles.charCodeAt(i) - 48]);
    }
  }
  return P;
}

/**
 * @noinline
 * @const {!Point}
 */
const G = new Point(
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
);

/** @const {bigint} */
const k = uint8ArrayBEtoBigInt(/** @type {!Uint8Array} */(
  crypto.getRandomValues(new Uint8Array(32)))) % P;
const kG = G.copy().multiply(k).project();

const m2 = () => { const r = multiply2(G.copy(), k).project(); assertEq(r.x, kG.x); assertEq(r.y, kG.y); };
const m4 = () => { const r = multiply4(G.copy(), k).project(); assertEq(r.x, kG.x); assertEq(r.y, kG.y); };
const m8 = () => { const r = multiply8(G.copy(), k).project(); assertEq(r.x, kG.x); assertEq(r.y, kG.y); };
compareImpls([m8, m2, m4, m8, m2, m4], 1000, [], null);


/**
 * Unlike the % operation, modP always returns a positive number y such that
 *
 *   0 <= y < P  and  x = y (mod P).
 *
 * If positivity is not required, prefer the % operator.
 *
 * @param {bigint} x
 * @return {bigint} y such that x = y (mod P) and 0 <= y < P.
 */
const modP = (x) => {
  let res = x % P;
  return res >= 0n ? res : res + P;
}

/**
 * Here is a incorrect "optimization".
 *
 * @param {!Point} R
 * @return {!Point}
 */
const double = (R) => {
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

/**
 * @param {!Point} R
 * @return {!Point}
 */
const doubleRight = (R) => {
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

/**
 * @param {!Point} R
 * @return {!Point}
 */
const doubleRight2 = (R) => {
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

/**
 * @param {!Point} R
 * @return {!Point}
 */
const doubleGPT = (R) => {
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
{
  const A = G.copy();
  const B = G.copy();
  const C = G.copy();
  const D = G.copy();
  for (let i = 0; i < 1000; ++i) {
    double(A);
    doubleRight(B);
    doubleGPT(C);
    doubleRight2(D);
    assertEq(A.x, B.x);
    assertEq(B.x, C.x);
    assertEq(C.x, D.x);
    assertEq(A.y, B.y);
    assertEq(B.y, C.y);
    assertEq(C.y, D.y);
    assertEq(A.z, B.z);
    assertEq(B.z, C.z);
    assertEq(C.z, D.z);
  }
}

compareImpls([
  () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) double(A); },
  () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleRight(A); },
  () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleGPT(A); },
  () => { const A = G.copy(); for (let i = 0; i < 10000; ++i) doubleRight2(A); },
], 10, [], null);

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

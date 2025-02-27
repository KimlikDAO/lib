/**
 * Some experiments with the curves discovered in
 * @see https://hackmd.io/@dJO3Nbl4RTirkR2uDM6eOA/Bk0NvC8Vo
 */
import { assertEq } from "../../testing/assert";
import bigints from "../../util/bigints";
import { arfCurve, Point as IPoint } from "../arfCurve";
import { P, Q, sqrt } from "../secp256k1";

const R = (1n << 256n) - 0x1f90dcfcda9f17c1ec7159037a804b86cn;

/** QQ has 5 prime factors */
assertEq(2n * 2n * 3n * 20412485227n
  * 0x47d1ce07a20a6fb9d527970739c33bc403bdc1c5f20caaf815571a5n, R);

/**
 * @typedef {IPoint} Point */
/**
 * There appears to be a friend of secp256k1 right next to it.
 *
 * y^2 = x^3 + 1
 *
 * @const {function(new:IPoint, bigint, bigint, bigint=)}
 */
const Point = arfCurve(P);
/**
 * @typedef {IPoint} Point */
/**
 * There appears to be a friend of secp256k1 right next to it.
 *
 * y^2 = x^3 + 1
 *
 * @const {function(new:IPoint, bigint, bigint, bigint=)}
 */
const Qoint = arfCurve(Q);

/**
 * Returns a random even point.
 *
 * @return {!Point}
 */
Point.random = () => {
  for (; ;) {
    const x = bigints.fromBytesBE(/** @type {!Uint8Array} */(
      crypto.getRandomValues(new Uint8Array(32)))) % P;
    const y2 = (x * x * x + 1n) % P;
    const y = sqrt(y2);
    if ((y * y) % P == y2)
      return new Point(x, y);
  }
}

console.log(Q % 4n, P % 4n);
console.log(P % 3n, Q % 3n);

/**
 * @const {!Point}
 */
const G1 = new Point(1n, 0n);
const G2 = new Point(P - 1n, 0n)
const G3 = Point.random().multiply(R / 3n).project();
const G4 = Point.random().multiply(R / 20412485227n).project();
const G5 = Point.random().multiply(2n * 2n * 3n * 20412485227n).project();
const G = G1.copy().increment(G2).increment(G3).increment(G4).increment(G5).project();

console.log(G.multiply(R));

console.log(P - Q, Q - R);

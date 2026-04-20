/**
 * Some experiments with the curves mentioned in
 * @see https://hackmd.io/@dJO3Nbl4RTirkR2uDM6eOA/Bk0NvC8Vo
 */
import { assertIs } from "../../util/assert";
import bigints from "../../util/bigints";
import { arfCurve } from "../arfCurve";
import { Point } from "../ellipticCurve";
import { P, Q, sqrt } from "../secp256k1";

const R = (1n << 256n) - 0x1f90dcfcda9f17c1ec7159037a804b86cn;

/** R has 5 prime factors */
assertIs(2n * 2n * 3n * 20412485227n
  * 0x47d1ce07a20a6fb9d527970739c33bc403bdc1c5f20caaf815571a5n, R);

/**
 * This is the b = 1 class of the Arf Curve family for {@link P}.
 * For {@link P}, of the 6 isomorphism classes, only 1 leads to prime order,
 * corresponding to the b=7 equivalence class.
 * So this curve mentioned in the article is not interesting or suprising.
 */
const Curve = arfCurve(P, 1n, sqrt);

/**
 * Returns a random point uniformly supported on some size (Q-1)/2 subset of
 * the curve points.
 */
const random = (): Point => {
  for (; ;) {
    const x = bigints.random(256);
    if (x >= P) continue;
    const y2 = (x * x * x + 1n) % P;
    const y = sqrt(y2);
    if (y == null) continue;
    return Curve.pointFromAffine({ x, y });
  }
}

console.log(Q % 4n, P % 4n);
console.log(P % 3n, Q % 3n);

const G1 = Curve.pointFromAffine({ x: 1n, y: 0n });
const G2 = Curve.pointFromAffine({ x: P - 1n, y: 0n });
const G3 = random().multiply(R / 3n);
const G4 = random().multiply(R / 20412485227n);
const G5 = random().multiply(2n * 2n * 3n * 20412485227n);
const G = G1.copy().increment(G2).increment(G3).increment(G4).increment(G5);

console.log(G.multiply(R));
console.log(P - Q, Q - R);

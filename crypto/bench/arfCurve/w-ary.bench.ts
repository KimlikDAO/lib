import bigints from "../../../util/bigints";
import { bench } from "../../../util/testing/bench";
import { arfCurve } from "../../arfCurve";
import { Point } from "../../ellipticCurve";
import { P } from "../../secp256k1";

const SecpFamily = arfCurve(P);
/** @noinline */
const G: Point = SecpFamily.pointFromAffine({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
});
const O: Point = SecpFamily.O;

const multiply2 = (P: Point, n: bigint): Point => {
  if (!n) { P.x = P.y = P.z = 0n; return P; }
  const nBits = n.toString(2);
  const d = P.copy();
  for (let i = 1; i < nBits.length; ++i) {
    P.double();
    if (nBits.charCodeAt(i) == 49)
      P.increment(d);
  }
  return P;
}

const multiply4 = (P: Point, n: bigint): Point => {
  const nNibbles = n.toString(4);
  const P2 = P.copy().double();
  const P3 = P2.copy().increment(P);
  const d: readonly Point[] = [O, P.copy(), P2, P3];
  ({ x: P.x, y: P.y, z: P.z } = d[nNibbles.charCodeAt(0) - 48]);
  for (let i = 1; i < nNibbles.length; ++i) {
    P.double(); P.double();
    P.increment(d[nNibbles.charCodeAt(i) - 48]);
  }
  return P;
}

const multiply8 = (P: Point, n: bigint): Point => {
  const nNibbles = n.toString(8);
  const P2 = P.copy().double();
  const P3 = P2.copy().increment(P);
  const P4 = P2.copy().double();
  const d: readonly Point[] = [
    O, P.copy(), P2, P3, P4, P4.copy().increment(P),
    P4.copy().increment(P2), P3.copy().increment(P4)
  ];
  ({ x: P.x, y: P.y, z: P.z } = d[nNibbles.charCodeAt(0) - 48]);
  for (let i = 1; i < nNibbles.length; ++i) {
    P.double(); P.double(); P.double();
    P.increment(d[nNibbles.charCodeAt(i) - 48]);
  }
  return P;
}

const k = bigints.random(32) % P;

const pr_kG = G.copy().multiply(k).proj();

const m2 = (n: bigint) => multiply2(G.copy(), n).proj();
const m4 = (n: bigint) => multiply4(G.copy(), n).proj();
const m8 = (n: bigint) => multiply8(G.copy(), n).proj();

bench("w-ary scalar multiplication", {
  "base-2 (bit-by-bit)": m2,
  "base-4 (2-bit window)": m4,
  "base-8 (3-bit window)": m8,
}, {
  repeat: 1000,
  dataset: [{ args: [k], expected: pr_kG }],
});

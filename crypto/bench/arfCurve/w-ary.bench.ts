import { assertEq } from "../../../testing/assert";
import { compareImpls } from "../../../testing/bench";
import bigints from "../../../util/bigints";
import { arfCurve } from "../../arfCurve";
import { Point } from "../../ellipticCurve";
import { P } from "../../secp256k1";

const SecpFamily = arfCurve(P);
/** @noinline */
const G: Point = SecpFamily.pointFromAffine({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
});
const O: Point = new SecpFamily(0n, 0n, 0n);

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

const m2 = () => { const r = multiply2(G.copy(), k).proj(); assertEq(r, pr_kG); };
const m4 = () => { const r = multiply4(G.copy(), k).proj(); assertEq(r, pr_kG); };
const m8 = () => { const r = multiply8(G.copy(), k).proj(); assertEq(r, pr_kG); };
compareImpls([m8, m2, m4, m8, m2, m4], 1000, [], null);

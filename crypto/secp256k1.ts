/**
 * @fileoverview KimlikDAO secp256k1 implementation.
 *
 * The secp256k1 is the curve
 *
 *   y^2 = x^3 + 7
 *
 * over F_P, where P = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1.
 *
 * @author KimlikDAO
 */
import { PureExpr } from "../kdjs/kdjs.d";
import bigints from "../util/bigints";
import { arfCurve } from "./arfCurve";
import { Point as IPoint, aX_bY } from "./ellipticCurve";
import { inverse } from "./modular";

/** @noinline */
const P = (1n << 256n) - (1n << 32n) - 977n;
/** @noinline */
const Q = P - 0x14551231950b75fc4402da1722fc9baeen;

type Curve = new (x: bigint, y: bigint, z?: bigint) => IPoint;
const Point: Curve = arfCurve(P);

/** @pure */
const tower = (b: bigint, pow: number): bigint => {
  while (pow-- > 0)
    b = b * b % P;
  return b;
}

/** @pure */
const sqrt = (n: bigint): bigint => {
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
 * If x^3 + 7 is a quadratic residue, returns the point (x, y, 1) with the
 * provided x and y having yParity; otherwise returns null.
 * @pure
 */
const pointFrom = (x: bigint, yParity: boolean): IPoint | null => {
  const x2 = (x * x) % P;
  const y2 = (x2 * x + 7n) % P
  const y = sqrt(y2);
  // Note when a boolean and bigint are compared, the boolean is
  // cast to a bigint. Since y & 1n is 1n or 0n, this works out.
  return (y * y) % P == y2
    ? new Point(x, (y & 1n) == (yParity as unknown as bigint) ? y : P - y)
    : null;
}

const G = new Point(
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
) satisfies PureExpr;

const O = new Point(0n, 0n, 0n);

/** @pure */
const sign = (digest: bigint, privKey: bigint): {
  r: bigint,
  s: bigint,
  yParity: boolean
} => {
  for (; ;) {
    const k = bigints.fromBytesBE(
      crypto.getRandomValues(new Uint8Array(32)) as Uint8Array);
    if (k <= 0 || Q <= k) continue; // probability ~2^{-128}, i.e., a near impossibility.
    const K = G.copy().multiply(k).project();
    const r = K.x;
    if (r >= Q) continue; // probability ~2^{-128}, i.e., a near impossibility.
    let s = (inverse(k, Q) * ((digest + r * privKey) % Q)) % Q;
    if (s == 0n) continue; // probability ~2^{-256}
    let yParity = !!(K.y & 1n);
    if (s > (Q >> 1n)) {
      s = Q - s;
      yParity = !yParity;
    }
    return { r, s, yParity }
  }
}

/** @pure */
const verify = (
  digest: bigint,
  r: bigint,
  s: bigint,
  pubKey: IPoint
): boolean => {
  if (r <= 0n || Q <= r) return false;
  if (s <= 0n || Q <= s) return false;
  const is = inverse(s, Q);
  const U = aX_bY(digest * is % Q, G.copy(), r * is % Q, pubKey.copy());
  const z2 = (U.z * U.z) % P;
  if (!z2) return false;
  if ((r * z2) % P == U.x) return true;
  r += Q;
  return (r < P) && (r * z2) % P == U.x;
}

/**
 * Recovers the signer public key (a `Point`) for a given signed digest
 * if the signature is valid; otherwise returns `O`, the point at infinity.
 * @pure
 */
const recoverSigner = (
  digest: bigint,
  r: bigint,
  s: bigint,
  yParity: boolean
): IPoint => {
  if (r <= 0n || Q <= r) return O;
  if (s <= 0n || Q <= s) return O;
  const ir = inverse(r, Q);
  const K = pointFrom(r, yParity);
  if (!K) return O;
  return aX_bY(Q - (digest * ir % Q), G.copy(), s * ir % Q, K).project();
}

export {
  G, O, P, Q,
  Point,
  pointFrom,
  recoverSigner,
  sign,
  verify
};

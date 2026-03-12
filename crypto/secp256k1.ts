/**
 * The secp256k1 is the curve
 *
 *   y^2 = x^3 + 7
 *
 * over 𝔽ₚ, where P = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1.
 *
 * @author KimlikDAO
 */
import bigints from "../util/bigints";
import { arfCurve } from "./arfCurve";
import { Curve, CompressedPoint, Point, aX_bY } from "./ellipticCurve";
import { inverse } from "./modular";

/** @noinline */
const P = (1n << 256n) - (1n << 32n) - 977n;
/** @noinline */
const Q = P - 0x14551231950b75fc4402da1722fc9baeen;

/** @pure */
const tower = (b: bigint, pow: number): bigint => {
  while (pow-- > 0) b = b * b % P;
  return b;
}

/**
 * Returns the square root of n if n is a quadratic residue; null otherwise.
 *
 * @pure
 */
const sqrt = (n: bigint): bigint | null => {
  const b2 = n * n * n % P;
  const b3 = b2 * b2 * n % P;
  const b6 = tower(b3, 3) * b3 % P;
  const b9 = tower(b6, 3) * b3 % P;
  const b11 = tower(b9, 2) * b2 % P;
  const b22 = tower(b11, 11) * b11 % P;
  const b44 = tower(b22, 22) * b22 % P;
  const b88 = tower(b44, 44) * b44 % P;
  const b176 = tower(b88, 88) * b88 % P;
  const b220 = tower(b176, 44) * b44 % P;
  const b223 = tower(b220, 3) * b3 % P;
  const t1 = tower(b223, 23) * b22 % P;
  const t2 = tower(t1, 6) * b2 % P;
  const r = tower(t2, 2);
  return r * r % P == n ? r : null;
};

const Secp256k1: Curve = Object.assign(arfCurve(P), {
  /**
   * If x³ + 7 is a quadratic residue, returns the point (x, y, 1) with the
   * provided x and y satisfying y² = x³ + 7 with the given parity; otherwise
   * returns null.
   *
   * @pure
   */
  pointFrom({ x, yParity }: CompressedPoint): Point | null {
    const y2 = (x * x * x + 7n) % P
    const y = sqrt(y2);
    if (y == null) return null;
    return new Secp256k1(x, (y & 1n) == (yParity as unknown as bigint) ? y : P - y, 1n);
  }
}) as Curve;

/** @noinline */
const G: Point = Secp256k1.pointFromAffine({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
});

/** @pure */
const sign = (digest: bigint, privKey: bigint): {
  r: bigint,
  s: bigint,
  yParity: boolean
} => {
  for (; ;) {
    const k = bigints.random(32);
    if (k <= 0 || Q <= k) continue;
    const { x: r, y } = G.copy().multiply(k).proj();
    if (r >= Q) continue;
    let s = inverse(k, Q) * (digest + r * privKey) % Q;
    if (s == 0n) continue; // probability ~2^{-256}
    let yParity = !!(y & 1n);
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
  pubKey: { x: bigint, y: bigint }
): boolean => {
  if (r <= 0n || Q <= r || s <= 0n || Q <= s) return false;
  const H = Secp256k1.pointFromAffine(pubKey);
  const is = inverse(s, Q);
  const U = aX_bY(digest * is % Q, G.copy(), r * is % Q, H);
  const z2 = U.z * U.z % P;
  if (!z2) return false;
  if (r * z2 % P == U.x) return true;
  r += Q;
  return r < P && r * z2 % P == U.x;
}

/**
 * Recovers the signer public key, an affine point `(x, y)`, for a given signed
 * digest if the signature is valid; otherwise returns `(0, 0)`, the point at
 * infinity.
 *
 * @pure
 */
const recoverSigner = (
  digest: bigint,
  r: bigint,
  s: bigint,
  yParity: boolean
): { x: bigint, y: bigint } => {
  if (r <= 0n || Q <= r || s <= 0n || Q <= s)
    return { x: 0n, y: 0n };
  const ir = inverse(r, Q);
  const K = Secp256k1.pointFrom({ x: r, yParity});
  if (!K) return { x: 0n, y: 0n };
  return aX_bY(Q - (digest * ir % Q), G.copy(), s * ir % Q, K).proj();
}

export {
  G, P, Q, Secp256k1,
  sqrt,
  recoverSigner,
  sign,
  verify
};

import { LargeConstant } from "@kimlikdao/kdts";
import bigints from "../util/bigints";
import { arfCurve } from "./arfCurve";
import { AffinePoint, CompressedPoint, Curve, Point } from "./ellipticCurve";
import { P, poseidon } from "./minaPoseidon";
import { poseidon as poseidonLegacy } from "./minaPoseidonLegacy";
import { tonelliShanks } from "./modular";

const Q = P + 0x47afc1f319ba3400000000n satisfies LargeConstant;

/** @pure */
const sqrt = (n: bigint): bigint | null => tonelliShanks(n, P, (P - 1n) >> 32n,
  0x2bce74deac30ebda362120830561f81aea322bf2b7bb7584bdad6fabd87ea32fn, 32n);

const Pallas: Curve = Object.assign(arfCurve(P), {
  /**
   * If x³ + 5 is a quadratic residue, returns the point (x, y, 1) with the
   * provided x and y satisfying y² = x³ + 5 with the given parity; otherwise
   * returns null.
   *
   * x must be in [0, P)
   *
   * @pure
   */
  pointFrom({ x, yParity }: CompressedPoint): Point | null {
    const y = sqrt(x * x * x + 5n);
    if (!y) return null; // -5 is not a cubic residue, hence no point (x, 0)
    return new Pallas(x, (y & 1n) == (yParity as unknown as bigint) ? y : P - y, 1n);
  }
}) as Curve;

const G: Point = Pallas.pointFromAffine({
  x: 1n,
  y: 0x1b74b5a30a12937c53dfa9f06378ee548f655bd4333d477119cf7a23caed2abbn
});

/** @pure */
const hashFields = (
  fields: readonly bigint[],
  { x, y }: AffinePoint,
  r: bigint
): bigint => poseidon([
  0x2a2a2a2a2a2a2a65727574616e67695361646f43n,
  0n,
  ...fields,
  x,
  y,
  r
]);

/**
 * Signs the given `fields` with the provided `privKey`. If available,
 * providing the public key as an affine point `A` as a hint will prevent
 * recomputing it inside this function.
 *
 * @pure
 */
const signFields = (
  fields: readonly bigint[],
  privKey: bigint,
  A?: AffinePoint
): { r: bigint, s: bigint } => {
  A ||= G.copy().multiply(privKey).proj();
  let k = bigints.random(256) % Q;
  const { x: r, y } = G.copy().multiply(k).proj();
  if (y & 1n) k = Q - k;
  const e = hashFields(fields, A, r);
  const s = (k + e * privKey) % Q;
  return { r, s };
}

/** @pure */
const verifyFields = (
  fields: readonly bigint[],
  r: bigint,
  s: bigint,
  pubKey: CompressedPoint
): boolean => {
  const H = Pallas.pointFrom(pubKey);
  if (!H) return false;
  // Here we use the fact that Q > P and reinterpret the field element
  // as a scalar.
  const ne = Q - hashFields(fields, H, r);
  const neH = H.multiply(ne);
  // s.G = K + e.H, so
  // K = s.G - e.H
  const { x, y } = G.copy().multiply(s).increment(neH).proj();
  return (y & 1n) == 0n && x == r;
}

/** @pure */
const hashMessage = (message: string, { x, y }: AffinePoint, r: bigint): bigint => {
  const fields: bigint[] = [
    0x74656e6e69614d65727574616e676953616e694dn,
    0n,
    x,
    y,
    r
  ];
  const encoder = new TextEncoder();
  const bits = Array.from(
    encoder.encode(message),
    (c) => (c as number).toString(2).padStart(8, "0"))
    .join("")
    .split("")
    .reverse()
    .join("");
  for (let i = bits.length; i > 0; i -= 254)
    fields.push(BigInt("0b" + bits.substring(i - 254, i)));
  return poseidonLegacy(fields);
}

/**
 * Signs the given `message` with the provided `privKey`. If available,
 * providing the public key as an affine point `A` as a hint will prevent
 * recomputing it inside this function.
 *
 * @pure
 */
const signMessage = (message: string, privKey: bigint, A?: AffinePoint): {
  r: bigint,
  s: bigint
} => {
  A ||= G.copy().multiply(privKey).proj();
  let k = bigints.random(256) % Q;
  const { x: r, y } = G.copy().multiply(k).proj();
  if (y & 1n) k = Q - k;
  const e = hashMessage(message, A, r)
  const s = (k + e * privKey) % Q;
  return { r, s };
}

/** @pure */
const verifyMessage = (
  message: string,
  r: bigint,
  s: bigint,
  pubKey: CompressedPoint
): boolean => {
  const H = Pallas.pointFrom(pubKey);
  if (!H) return false;
  // Here we use the fact that Q > P and reinterpret the field element
  // as a scalar.
  const ne = Q - hashMessage(message, H, r);
  const neH = H.multiply(ne);
  // s.G = K + e.H
  const { x, y } = G.copy().multiply(s).increment(neH).proj();
  return (y & 1n) == 0n && x == r;
}

export {
  G, P, Pallas, Q,
  hashFields,
  hashMessage,
  signFields,
  signMessage,
  verifyFields,
  verifyMessage
};

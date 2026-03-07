import bigints from "../util/bigints";
import { arfCurve } from "./arfCurve";
import { Curve, Point as IPoint } from "./ellipticCurve";
import { P, poseidon } from "./minaPoseidon";
import { poseidon as poseidonLegacy } from "./minaPoseidonLegacy";
import { tonelliShanks } from "./modular";
import { PureExpr } from "../kdjs/kdjs.d";

/** @noinline */
const Q = P + 0x47afc1f319ba3400000000n;

const Point: Curve = arfCurve(P);

/** @noinline */
const G = new Point(1n,
  0x1b74b5a30a12937c53dfa9f06378ee548f655bd4333d477119cf7a23caed2abbn) satisfies PureExpr;

/** @pure */
const sqrt = (n: bigint): bigint | null =>
  tonelliShanks(n, P, (P - 1n) >> 32n, 0x2bce74deac30ebda362120830561f81aea322bf2b7bb7584bdad6fabd87ea32fn, 32n);

/**
 * If x^3 + 5 is a quadratic residue, returns the point (x, y, 1) with
 * y^2 = x^3 + 5 and y having yParity, otherwise returns null.
 * @pure
 */
const pointFrom = (x: bigint, yParity: boolean): IPoint | null => {
  const x2 = (x * x) % P;
  const y2 = (x2 * x + 5n) % P
  const y = sqrt(y2);
  return y
    ? new Point(x, (y & 1n) == (yParity as unknown as bigint) ? y : P - y)
    : null;
}

/** @pure */
const hashFields = (fields: readonly bigint[], X: IPoint, r: bigint): bigint =>
  poseidon([
    0x2a2a2a2a2a2a2a65727574616e67695361646f43n,
    0n,
    ...fields,
    X.x,
    X.y,
    r
  ]);

/**
 * Signs the give `fields` with the provided `privKey`. If available, providing
 * the `pubKey` as a hint will prevent recomputing it.
 * @pure
 */
const signFields = (
  fields: readonly bigint[],
  privKey: bigint,
  pubKey?: IPoint
): {
  r: bigint,
  s: bigint
} => {
  pubKey ||= G.copy().multiply(privKey).project();
  let k = bigints.fromBytesBE(
    crypto.getRandomValues(new Uint8Array(32)) as Uint8Array) % Q;
  const K = G.copy().multiply(k).project();
  if (K.y & 1n) k = Q - k;
  const e = hashFields(fields, pubKey, K.x);
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

/**
 * The parameter `pubKey` is modified during the verification.
 * @pure
 */
const verifyFields = (
  fields: readonly bigint[],
  r: bigint,
  s: bigint,
  pubKey: IPoint
): boolean => {
  // Here we use the fact that Q > P and reinterpret the field element
  // as a scalar.
  const ne = Q - hashFields(fields, pubKey, r);
  // s.G = K + pubKey.e
  const K = G.copy().multiply(s).increment(pubKey.multiply(ne)).project();
  return (K.y & 1n) == 0n && K.x == r;
}

/** @pure */
const hashMessage = (message: string, X: IPoint, r: bigint): bigint => {
  const fields: bigint[] = [
    0x74656e6e69614d65727574616e676953616e694dn,
    0n,
    X.x,
    X.y,
    r
  ];
  const encoder = new TextEncoder();
  const bits = Array.from(
    encoder.encode(message),
    (c: number) => (c as number).toString(2).padStart(8, "0"))
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
 * providing the `pubKey` as a hint will prevent recomputing it.
 * @pure
 */
const signMessage = (message: string, privKey: bigint, pubKey?: IPoint): {
  r: bigint,
  s: bigint
} => {
  pubKey ||= G.copy().multiply(privKey).project();
  let k = bigints.fromBytesBE(
    crypto.getRandomValues(new Uint8Array(32)) as Uint8Array) % Q;
  const K = G.copy().multiply(k).project();
  if (K.y & 1n) k = Q - k;
  const e = hashMessage(message, pubKey, K.x)
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

/**
 * The parameter `pubKey` is modified during the verification.
 * @pure
 */
const verifyMessage = (
  message: string,
  r: bigint,
  s: bigint,
  pubKey: IPoint
): boolean => {
  // Here we use the fact that Q > P and reinterpret the field element
  // as a scalar.
  const ne = Q - hashMessage(message, pubKey, r);
  // s.G = K + pubKey.e
  const K = G.copy().multiply(s).increment(pubKey.multiply(ne)).project();
  return (K.y & 1n) == 0n && K.x == r;
}

export {
  G,
  hashFields,
  hashMessage,
  P,
  Point,
  pointFrom,
  Q,
  signFields,
  signMessage,
  verifyFields,
  verifyMessage
};

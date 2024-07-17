import { Point as IPoint, arfCurve } from "./arfCurve";
import { poseidon } from "./poseidon"

/** @const {!bigint} */
const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;
/** @const {!bigint} */
const Q = (1n << 254n) + 0x224698fc0994a8dd8c46eb2100000001n;

/** @const {function(new:IPoint, !bigint, !bigint, !bigint)} */
const Point = arfCurve(P);

/**
 * @const {!Point}
 * @noinline
 */
const G = new Point(1n, 0x1b74b5a30a12937c53dfa9f06378ee548f655bd4333d477119cf7a23caed2abbn, 1n);

/** @const {!Array<!bigint>} */
const MainnetPrefixes = [
  0x3f397ea623a7a15bffc260e794a9b833419cd6a337ef1cbca78c0d1b0c6a4a49n,
  0x1ccea478cc3c75a7e6f4d777410cbb47292dd1204b7fac9819d43dcdef61254cn,
  0x523e193ede92f4728b13806fef9a719e007eea2175726e09bd776d166eaabfbn
];

const serialize = (message) => {
  let packedFields = [];
  const bits = [...new TextEncoder().encode(message).reverse()].map((byte) => byte.toString(2).padStart(8, '0')).join('');
  const bitsReversed = Array.from(bits).reverse().join();
  for (let i = 0; i < bits.length; i += 254)
    packedFields.push(BigInt('0b' + bitsReversed.slice(i, i + 254)));
  return packedFields;
}

/**
 * @param {string} message
 * @param {!Point} X
 * @param {!bigint} kx
 * @return {!bigint}
 */
const hashMessage = (message, X, kx) =>
  poseidon(MainnetPrefixes.concat(serialize(message), X.x, X.y, kx));

/**
 * @param {string} message
 * @param {!bigint} privKey
 */
const sign = (message, privKey) => {
  /** @const {!Point} */
  const X = G.copy().multiply(privKey).project();
  /** @type {!bigint} */
  let k = BigInt("0x" + hex(/** @type {!Uint8Array} */(
    crypto.getRandomValues(new Uint8Array(32))))) % Q;
  const K = G.copy().multiply(k).project();

  if (K.y & 1n) k = Q - k;
  /** @const {!bigint} */
  const e = hashMessage(message, X, K.x)
  /** @const {!bigint} */
  const s = (k + e * privKey) % Q;
  return { r: K.x, s };
}

export {
  sign,
  verify
}

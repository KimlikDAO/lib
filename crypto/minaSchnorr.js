import { Point as IPoint, arfCurve } from "./arfCurve";

/** @const {!bigint} */
const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;

/** @const {function(new:IPoint, !bigint, !bigint, !bigint)} */
const Point = arfCurve(P);

/**
 * @const {!Point}
 * @noinline
 */
const G = new Point(1n, 0x1b74b5a30a12937c53dfa9f06378ee548f655bd4333d477119cf7a23caed2abbn, 1n);

/**
 */
const sign = (digest, privKey) => {
  const X = G.copy().multiply(privKey)
  let k = deriveNonce()
  const K = G.copy().multiply(k).project();

  if (K.x & 1n) k = Q - k;
  const e = hashMessage(message, X, K.x)
  const s = (k + e * privKey) % P;
  return { r: K.x, s };
}

function bytesToBits(bytes) {
  return bytes
    .map((byte) => {
      let bits = Array(8);
      for (let i = 0; i < 8; i++) {
        bits[i] = !!(byte & 1);
        byte >>= 1;
      }
      return bits;
    })
    .flat();
}

function stringToInput(string) {
  let bits = stringToBytes(string)
    .map((byte) => bytesToBits([byte]).reverse())
    .flat();
  return HashInputLegacy.bits(bits);
}


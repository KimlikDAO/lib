import {
  AffinePoint,
  CompressedPoint,
  compressPoint
} from "../crypto/ellipticCurve";
import bigints from "../util/bigints";
import { Address } from "./address.d";
import { decode, encode } from "./encoding";

/** @pure  */
const fromPublicKey = ({ x, yParity }: CompressedPoint): Address => {
  const buff = new Uint8Array(40);
  buff[0] = 203;
  buff[1] = buff[2] = 1;
  bigints.intoBytesLE(buff.subarray(3), x);
  buff[35] = +yParity;
  return encode(buff);
}

/** @pure  */
const toPublicKey = (addr: Address): CompressedPoint => {
  const bytes = decode(addr);
  return {
    x: bigints.fromBytesLE(bytes.subarray(3, 35)),
    yParity: !!bytes[35]
  };
}

/** @pure  */
const fromPoint = (A: AffinePoint): Address =>
  fromPublicKey(compressPoint(A));

export default {
  fromPublicKey,
  fromPoint,
  toPublicKey
};

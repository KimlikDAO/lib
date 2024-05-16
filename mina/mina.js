import base58 from "../util/base58";
import { uint8ArrayBEtoBigInt } from "../util/çevir";

/**
 * @constructor
 * @struct
 * @param {!bigint} x
 * @param {boolean} isOdd
 */
const PublicKey = function (x, isOdd) {
  /** @const {!bigint} */
  this.x = x;
  /** @const {boolean} */
  this.isOdd = isOdd;
}

/**
 * @param {string} addr
 * @return {!PublicKey}
 */
PublicKey.fromBase58 = function (addr) {
  const bytes = base58.toBytes(addr);
  return new PublicKey(uint8ArrayBEtoBigInt(bytes.subarray(3, 35)), !!bytes[35]);
}

export {
  PublicKey
};

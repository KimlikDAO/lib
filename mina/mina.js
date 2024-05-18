import base58 from "../util/base58";
import { uint8ArrayLEtoBigInt, uint8ArrayeHexten } from "../util/çevir";

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
  return new PublicKey(uint8ArrayLEtoBigInt(bytes.subarray(3, 35)), !!bytes[35]);
}

/**
 * @param {!Uint8Array} buff a buffer of length at least 33
 */
PublicKey.prototype.serializeInto = function (buff) {
  const xHex = this.x.toString(16).padStart(64, "0");
  uint8ArrayeHexten(buff, xHex);
  buff[32] = +this.isOdd;
}

export {
  PublicKey,
};

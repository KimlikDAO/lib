import base58 from "../util/base58";
import {
  uint8ArrayBEtoBigInt,
  uint8ArrayLEtoBigInt,
  uint8ArrayeHexten
} from "../util/çevir";

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
PublicKey.fromBase58 = (addr) => {
  const bytes = base58.toBytes(addr);
  return new PublicKey(uint8ArrayLEtoBigInt(bytes.subarray(3, 35)), !!bytes[35]);
}

/**
 * @param {!Uint8Array} bytes
 * @return {!PublicKey}
 */
PublicKey.fromBytes = (bytes) =>
  new PublicKey(uint8ArrayBEtoBigInt(bytes.subarray(0, 32)), !!bytes[32]);

/**
 * @param {!Uint8Array} buff a buffer of length at least 33
 */
PublicKey.prototype.serializeInto = function (buff) {
  const xHex = this.x.toString(16).padStart(64, "0");
  uint8ArrayeHexten(buff, xHex);
  buff[32] = +this.isOdd;
}

/**
 * @param {string} privateKeyStr
 * @return {!bigint}
 */
const parsePrivateKey = (privateKeyStr) =>
  uint8ArrayLEtoBigInt(base58.toBytes(privateKeyStr).subarray(2, 34))

/**
 * @param {string} signatureStr
 * @return {{
 *   r: !bigint,
 *   s: !bigint
 * }}
 */
const parseSignature = (signatureStr) => {
  const bytes = base58.toBytes(signatureStr);
  return {
    r: uint8ArrayLEtoBigInt(bytes.subarray(2, 34)),
    s: uint8ArrayLEtoBigInt(bytes.subarray(34, 66))
  };
}

export {
  PublicKey,
  parsePrivateKey,
  parseSignature,
};

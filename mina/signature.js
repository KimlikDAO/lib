import base58 from "../util/base58";
import bigints from "../util/bigints";
import { addChecksum } from "./mina";

/**
 * @constructor
 * @struct
 * @param {bigint} r
 * @param {bigint} s
 */
function Signature(r, s) {
  /** @const {bigint} */
  this.r = r;
  /** @const {bigint} */
  this.s = s;
}

/**
 * @param {string} sig
 * @return {Signature}
 */
Signature.fromBase58 = function (sig) {
  /** @const {Uint8Array} */
  const bytes = base58.toBytes(sig);
  return new Signature(
    bigints.fromBytesLE(bytes.subarray(2, 34)),
    bigints.fromBytesLE(bytes.subarray(34, 66))
  );
}

/** @return {string} */
Signature.prototype.toBase58 = function () {
  /** @const {Uint8Array} */
  const buff = new Uint8Array(70);
  buff[0] = 154;
  buff[1] = 1;
  bigints.intoBytesLE(buff.subarray(2), this.r);
  bigints.intoBytesLE(buff.subarray(34), this.s);
  addChecksum(buff);
  return base58.from(buff);
}

export { Signature };

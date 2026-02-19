import base58 from "../util/base58";
import bigints from "../util/bigints";
import { addChecksum } from "./mina";
import { Signature } from "./signature.d";

/**
 * @param {{
 *   r: bigint,
 *   s: bigint
 * }} sig
 * @return {Signature}
 */
const fromUnpacked = ({ r, s }) => {
  /** @const {Signature} */
  /** @const {Uint8Array} */
  const buff = new Uint8Array(70);
  buff[0] = 154;
  buff[1] = 1;
  bigints.intoBytesLE(buff.subarray(2), r);
  bigints.intoBytesLE(buff.subarray(34), s);
  addChecksum(buff);
  return base58.from(buff);
}

const toUnpacked = (sig) => {
  /** @const {Uint8Array} */
  const bytes = base58.toBytes(sig);
  return {
    r: bigints.fromBytesLE(bytes.subarray(2, 34)),
    s: bigints.fromBytesLE(bytes.subarray(34, 66))
  };
}

export default { fromUnpacked, toUnpacked };

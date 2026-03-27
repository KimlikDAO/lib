import base58 from "../util/base58";
import bigints from "../util/bigints";
import { encode } from "./encoding";
import { Signature } from "./signature.d";

type UnpackedSignature = {
  r: bigint;
  s: bigint;
};

/** @pure */
const fromUnpacked = ({ r, s }: UnpackedSignature): Signature => {
  const buff = new Uint8Array(70);
  buff[0] = 154;
  buff[1] = 1;
  bigints.intoBytesLE(buff, r, 2);
  bigints.intoBytesLE(buff, s, 34);
  return encode(buff);
}

/** @pure */
const toUnpacked = (sig: Signature): UnpackedSignature => {
  const bytes = base58.toBytes(sig);
  return {
    r: bigints.fromBytesLE(bytes.subarray(2, 34)),
    s: bigints.fromBytesLE(bytes.subarray(34, 66))
  };
}

export default { fromUnpacked, toUnpacked };

import { G } from "../../crypto/minaSchnorr";
import { PublicKey } from "../mina";

/**
 * @param {bigint} privKey
 * @return {string}
 */
const addr = (privKey) => PublicKey
  .fromPoint(G.copy().multiply(privKey).project())
  .toBase58();

export { addr };

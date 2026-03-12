import { G } from "../../crypto/minaSchnorr";
import address from "../address";
import { Address } from "../address.d";

const addr = (privKey: bigint): Address => address
  .fromPoint(G.copy().multiply(privKey).proj());

export { addr };

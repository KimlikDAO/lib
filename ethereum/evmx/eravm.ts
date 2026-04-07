import { keccak256Uint8 } from "../../crypto/sha3";
import { Address } from "../address.d";

const CreatePrefix = keccak256Uint8(new TextEncoder().encode("zksyncCreate"));

/**
 * Computes the contract address for EraVM with a deployment nonce <= 255.
 * @satisfies {PureFn}
 */
const getCreateAddress = (deployer: Address, nonce: number): Address => {
  const out = new Uint8Array(96);
  out.set(CreatePrefix);
  for (let i = 1; i <= 20; ++i)
    out[i + 31 + 12] = parseInt(deployer.substring(2 * i, 2 * i + 2), 16);
  out[95] = nonce;
  return "0x" + keccak256Uint8(out).subarray(12, 32).toHex();
}

export { getCreateAddress };

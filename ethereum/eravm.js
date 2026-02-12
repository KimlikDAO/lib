import { keccak256Uint8 } from "../crypto/sha3";
import hex from "../util/hex";

/** @const {Uint8Array} */
const CreatePrefix = keccak256Uint8(new TextEncoder().encode("zksyncCreate"));

/**
 * Computes the contract address deployed on EraVM with a
 * deployment nonce <= 255.
 *
 * @param {string} deployer
 * @param {number} nonce
 * @return {string}
 */
const getCreateAddress = (deployer, nonce) => {
  /** @const {Uint8Array} */
  const out = new Uint8Array(96);
  out.set(CreatePrefix);
  for (let /** number */ i = 1; i <= 20; ++i)
    out[i + 31 + 12] = parseInt(deployer.substring(2 * i, 2 * i + 2), 16);
  out[95] = nonce;
  return "0x" + hex.from(keccak256Uint8(out).subarray(12, 32));
}

export { getCreateAddress };

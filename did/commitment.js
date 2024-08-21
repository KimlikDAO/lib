import { ChainGroup } from "../crosschain/chains";
import { poseidon } from "../crypto/minaPoseidon";
import { keccak256Uint32 } from "../crypto/sha3";
import { PublicKey } from "../mina/mina";
import {
  base64,
  base64tenSayıya,
  sayıdanBase64e,
  uint8ArrayeBase64ten,
  uint8ArrayeHexten,
} from "../util/çevir";

/**
 * @param {ChainGroup} chainGroup
 * @param {string} ownerAddress
 * @param {string} commitmentR
 * @return {string} base64 encoded commitment 
 */
const commit = (chainGroup, ownerAddress, commitmentR) => {
  switch (chainGroup) {
    default:
    case ChainGroup.EVM:
      /** @const {!Uint8Array} */
      const buff = new Uint8Array(32 + 20);
      uint8ArrayeBase64ten(buff, commitmentR);
      uint8ArrayeHexten(buff.subarray(32), ownerAddress.slice(2));
      return base64(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32));
    case ChainGroup.MINA:
      // TODO(KimlikDAO-bot): just use Pedersen commitment with (X.x + X.isOdd) % P
      const { x, isOdd } = PublicKey.fromBase58(ownerAddress);
      return sayıdanBase64e(poseidon([base64tenSayıya(commitmentR), isOdd ? x + 1n : x]));
  }
}

/**
 * Given a random array of length 2x32 Uint8Array, outputs
 * 
 *   commitment and commitmentAnon
 *
 * as a length 2x32 Uint8Array.
 * 
 * TODO(KimlikDAO-bot): work over Uint32Arrays.
 *
 * @param {ChainGroup} chainGroup
 * @param {string} address wallet address to commit to
 * @param {!Uint8Array} random random seed
 * @return {!Uint8Array} 2x32 bits cryptographic commitment
 */
const commitDouble = (chainGroup, address, random) => {
  switch (chainGroup) {
    case ChainGroup.EVM: {
      /** @const {!Uint8Array} */
      const buff = new Uint8Array(32 + 20);
      uint8ArrayeHexten(buff.subarray(32), address.slice(2));
      buff.set(random.subarray(0, 32));
      /** @const {!Uint8Array} */
      const commitment = new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 64);
      buff.set(random.subarray(32, 64));
      commitment.set(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 64), 32);
      return commitment;
    }
    case ChainGroup.MINA:
  }
  return new Uint8Array(64);
}

export {
  commit,
  commitDouble
};

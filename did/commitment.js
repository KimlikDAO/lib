import { ChainGroup } from "../crosschain/chains";
import { poseidon } from "../crypto/minaPoseidon";
import { keccak256Uint32 } from "../crypto/sha3";
import { PublicKey } from "../mina/mina";
import base64 from "../util/base64";
import bigints from "../util/bigints";
import hex from "../util/hex";

/**
 * @param {ChainGroup} chainGroup
 * @param {string} ownerAddress
 * @param {string} commitmentR base64 encoded commitment blinding factor
 * @return {string} base64 encoded commitment 
 */
const commit = (chainGroup, ownerAddress, commitmentR) => {
  switch (chainGroup) {
    default:
    case ChainGroup.EVM:
      /** @const {Uint8Array} */
      const buff = new Uint8Array(32 + 20);
      base64.intoBytes(buff, commitmentR);
      hex.intoBytes(buff.subarray(32), ownerAddress.slice(2));
      return base64.from(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32));
    case ChainGroup.MINA:
      const { x, isOdd } = PublicKey.fromBase58(ownerAddress);
      const commitmentBytes = base64.toBytes(commitmentR);
      const outBuff = new Uint8Array(32);
      bigints.intoBytesLE(outBuff, poseidon([
        bigints.fromBytesLE(commitmentBytes), isOdd ? x + 1n : x
      ]));
      return base64.from(outBuff);
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
 * @param {string} ownerAddress wallet address to commit to
 * @param {Uint8Array} random 2x32 bits random seed
 * @return {Uint8Array} 2x32 bits cryptographic commitment
 */
const commitDouble = (chainGroup, ownerAddress, random) => {
  switch (chainGroup) {
    default:
    case ChainGroup.EVM: {
      /** @const {Uint8Array} */
      const buff = new Uint8Array(32 + 20);
      hex.intoBytes(buff.subarray(32), ownerAddress.slice(2));
      buff.set(random.subarray(0, 32));
      /** @const {Uint8Array} */
      const commitment = new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 64);
      buff.set(random.subarray(32, 64));
      commitment.set(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32), 32);
      return commitment;
    }
    case ChainGroup.MINA:
      /** @const {Uint8Array} */
      const commitment = new Uint8Array(64);
      const { /** bigint */ x, isOdd } = PublicKey.fromBase58(ownerAddress);
      const /** bigint */ h = isOdd ? x + 1n : x;
      bigints.intoBytesLE(
        commitment,
        poseidon([bigints.fromBytesLE(random.subarray(0, 32)), h]));
      bigints.intoBytesLE(
        commitment.subarray(32),
        poseidon([bigints.fromBytesLE(random.subarray(32)), h]));
      return commitment;
  }
}

export {
  commit,
  commitDouble
};

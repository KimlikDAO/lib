import { ChainGroup } from "../crosschain/chains";
import { poseidon } from "../crypto/minaPoseidon";
import { keccak256Uint32 } from "../crypto/sha3";
import { PublicKey } from "../mina/mina";
import {
  base64,
  base64ten,
  uint8ArrayeBase64ten,
  uint8ArrayeHexten,
  uint8ArrayLEtoBigInt,
  uint8ArrayLEyeSayıdan
} from "../util/çevir";

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
      /** @const {!Uint8Array} */
      const buff = new Uint8Array(32 + 20);
      uint8ArrayeBase64ten(buff, commitmentR);
      uint8ArrayeHexten(buff.subarray(32), ownerAddress.slice(2));
      return base64(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32));
    case ChainGroup.MINA:
      const { x, isOdd } = PublicKey.fromBase58(ownerAddress);
      const commitmentBytes = base64ten(commitmentR);
      const outBuff = new Uint8Array(32);
      uint8ArrayLEyeSayıdan(outBuff, poseidon([
        uint8ArrayLEtoBigInt(commitmentBytes), isOdd ? x + 1n : x
      ]));
      return base64(outBuff);
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
 * @param {!Uint8Array} random 2x32 bits random seed
 * @return {!Uint8Array} 2x32 bits cryptographic commitment
 */
const commitDouble = (chainGroup, ownerAddress, random) => {
  switch (chainGroup) {
    default:
    case ChainGroup.EVM: {
      /** @const {!Uint8Array} */
      const buff = new Uint8Array(32 + 20);
      uint8ArrayeHexten(buff.subarray(32), ownerAddress.slice(2));
      buff.set(random.subarray(0, 32));
      /** @const {!Uint8Array} */
      const commitment = new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 64);
      buff.set(random.subarray(32, 64));
      commitment.set(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32), 32);
      return commitment;
    }
    case ChainGroup.MINA:
      /** @const {!Uint8Array} */
      const commitment = new Uint8Array(64);
      const { x, isOdd } = PublicKey.fromBase58(ownerAddress);
      const /** bigint */ h = isOdd ? x + 1n : x;
      uint8ArrayLEyeSayıdan(
        commitment,
        poseidon([uint8ArrayLEtoBigInt(random.subarray(0, 32)), h]));
      uint8ArrayLEyeSayıdan(
        commitment.subarray(32),
        poseidon([uint8ArrayLEtoBigInt(random.subarray(32)), h]));
      return commitment;
  }
}

export {
  commit,
  commitDouble
};

import { Address } from "../crosschain/address";
import { ChainGroup } from "../crosschain/chains";
import { poseidon } from "../crypto/minaPoseidon";
import { keccak256Uint32 } from "../crypto/sha3";
import address from "../mina/address";
import base64 from "../util/base64";
import bigints from "../util/bigints";
import hex from "../util/hex";

const commit = (
  chainGroup: ChainGroup,
  ownerAddress: Address,
  commitmentR: string
): string => {
  switch (chainGroup) {
    default:
    case ChainGroup.EVM:
      const buff = new Uint8Array(32 + 20);
      base64.intoBytes(buff, commitmentR);
      hex.intoBytes(buff.subarray(32), ownerAddress.slice(2));
      return base64.from(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32));
    case ChainGroup.MINA:
      const { x, yParity } = address.toPublicKey(ownerAddress);
      const commitmentBytes = base64.toBytes(commitmentR);
      const outBuff = new Uint8Array(32);
      bigints.intoBytesLE(outBuff, poseidon([
        bigints.fromBytesLE(commitmentBytes), yParity ? x + 1n : x
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
 */
const commitDouble = (
  chainGroup: ChainGroup,
  ownerAddress: Address,
  random: Uint8Array
): Uint8Array => {
  switch (chainGroup) {
    default:
    case ChainGroup.EVM: {
      const buff = new Uint8Array(32 + 20);
      hex.intoBytes(buff.subarray(32), ownerAddress.slice(2));
      buff.set(random.subarray(0, 32));
      const commitment = new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 64);
      buff.set(random.subarray(32, 64));
      commitment.set(new Uint8Array(
        keccak256Uint32(new Uint32Array(buff.buffer)).buffer, 0, 32), 32);
      return commitment;
    }
    case ChainGroup.MINA:
      const commitment = new Uint8Array(64);
      const { x, yParity } = address.toPublicKey(ownerAddress);
      const h = yParity ? x + 1n : x;
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

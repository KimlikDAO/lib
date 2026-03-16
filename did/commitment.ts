import { Address } from "../crosschain/address";
import { ChainGroup } from "../crosschain/chains";
import { poseidon } from "../crypto/minaPoseidon";
import { keccak256Uint32 } from "../crypto/sha3";
import address from "../mina/address";
import base64 from "../util/base64";
import bigints from "../util/bigints";
import hex from "../util/hex";
import { HumanID, Section } from "./section.d";

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
 * Given a random array of length 2x32 Uint8Array, outputs a 72 bytes
 * Uint8Array with the following layout:
 * 
 *   32 bytes {@link Section.commitment}
 *   32 bytes {@link HumanID.commitment}
 *    8 bytes {@link Uint8Array(8)} padding for pow nonce
 *
 * @pure
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
      const commitment = new Uint32Array(18);
      commitment.set(keccak256Uint32(new Uint32Array(buff.buffer)), 0);
      buff.set(random.subarray(32, 64));
      commitment.set(keccak256Uint32(new Uint32Array(buff.buffer)), 8);
      return new Uint8Array(commitment.buffer, 0, 72);
    }
    case ChainGroup.MINA:
      const commitment = new Uint8Array(72);
      const { x, yParity } = address.toPublicKey(ownerAddress);
      const h = yParity ? x + 1n : x;
      bigints.intoBytesLE(
        commitment,
        poseidon([bigints.fromBytesLE(random.subarray(0, 32)), h]));
      bigints.intoBytesLE(
        commitment,
        poseidon([bigints.fromBytesLE(random.subarray(32)), h]), 32);
      return commitment;
  }
}

export {
  commit,
  commitDouble
};

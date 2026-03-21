import { poseidon } from "../crypto/minaPoseidon";
import hex from "../util/hex";
import {
  BinaryKey,
  HexKey,
  MerkleTree,
  Witness
} from "./merkleTree";

class MinaMerkleTree implements MerkleTree {
  private nodes: Record<string, bigint> = {};
  private zeros: bigint[];

  constructor(private height: number) {
    const zeros: bigint[] = Array(height + 1);
    zeros[height] = 0n;
    for (let i = height; i > 0; --i)
      zeros[i - 1] = poseidon([zeros[i], zeros[i]]);
    this.zeros = zeros;
  }

  /** @pure */
  getNode(key: BinaryKey): bigint {
    return this.nodes[key] ?? this.zeros[key.length];
  }

  setLeaf(key: HexKey, val: bigint): bigint {
    let h = this.height;
    key = hex.toBinary(key).padStart(h, "0").slice(0, h);
    for (; ; --h) {
      this.nodes[key] = val;
      if (!key) return val;
      const isLeft = key.charCodeAt(key.length - 1) == 48; // 0
      key = key.slice(0, -1);
      const sibling = this.nodes[key + +isLeft] ?? this.zeros[h];
      val = poseidon(isLeft ? [val, sibling] : [sibling, val]);
    }
  }

  /** @pure */
  getWitness(key: HexKey): Witness[] {
    const h = this.height;
    key = hex.toBinary(key).padStart(h, "0").slice(0, h);
    const witness: Witness[] = Array(this.height);
    for (let d = 0; key; ++d) {
      const isLeft = key.charCodeAt(key.length - 1) == 48;
      key = key.slice(0, -1);
      const sibling = this.nodes[key + +isLeft] ?? this.zeros[h - d];
      witness[d] = { isLeft, sibling };
    }
    return witness;
  }
}

export { MinaMerkleTree };

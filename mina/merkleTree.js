import { poseidon } from "../crypto/minaPoseidon";
import hex from "../util/hex";
import {
  BinaryKey,
  HexKey,
  MerkleTree,
  Value,
  WitnessElem,
} from "../util/merkleTree";

/**
 * @implements {MerkleTree}
 */
class MinaMerkleTree {
  /**
   * @param {number} height
   */
  constructor(height) {
    /** @const {number} */
    this.height = height;
    /**
     * @private
     * @const {Record<string, Value>}
     */
    this.nodes = {};
    /** @const {Value[]} */
    const zeros = Array(height + 1);
    /** @const {Value[]} */
    zeros[height] = 0n;
    for (let i = height; i > 0; --i)
      zeros[i - 1] = poseidon([zeros[i], zeros[i]]);
    /** @const {Value[]} */
    this.zeros = zeros;
  }

  /**
   * @override
   *
   * @param {BinaryKey} key
   * @return {Value}
   */
  getNode(key) {
    return this.nodes[key] || this.zeros[key.length];
  }

  /**
   * @override
   *
   * @param {HexKey} key
   * @param {Value} val
   * @return {Value} the root after insertion
   */
  setLeaf(key, val) {
    /** @type {number} */
    let h = this.height;
    key = hex.toBinary(key).padStart(h, "0").slice(0, h);
    for (; ; --h) {
      this.nodes[key] = val;
      if (!key) return val;
      const isLeft = key.charCodeAt(key.length - 1) == 48;
      key = key.slice(0, -1);
      const sibling = this.nodes[key + +isLeft] || this.zeros[h];
      val = poseidon(isLeft ? [val, sibling] : [sibling, val]);
    }
  }

  /**
   * @override
   *
   * @param {HexKey} key
   * @return {WitnessElem[]}
   */
  getWitness(key) {
    /** @const {number} */
    const h = this.height;
    key = hex.toBinary(key).padStart(h, "0").slice(0, h);
    /** @const {WitnessElem[]} */
    const witness = Array(this.height);
    for (let d = 0; key; ++d) {
      const isLeft = key.charCodeAt(key.length - 1) == 48;
      key = key.slice(0, -1);
      witness[d] = {
        isLeft,
        sibling: this.nodes[key + (+isLeft)] || this.zeros[h - d],
      };
    }
    return witness;
  }
}

export { BinaryKey, HexKey, MinaMerkleTree, Value, WitnessElem };

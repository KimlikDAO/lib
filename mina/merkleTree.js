import { poseidon } from "../crypto/poseidon";

/** @typedef {string} */
const BinaryKey = {};

/**
 * @param {string} key
 * @return {BinaryKey}
 */
const hexToBinary = (key) => { }

class MerkleTree {
  /**
   * @param {number} height
   */
  constructor(height) {
    /** @const {number} */
    this.height = height;
    /**
     * @private
     * @const {!Object<string, !bigint>}
     */
    this.nodes = {};
    /** @const {!Array<!bigint>} */
    const zeros = Array(height + 1);
    /** @const {!Array<!bigint>} */
    zeros[height] = 0n;
    for (let i = height; i > 0; --i)
      zeros[i - 1] = poseidon([zeros[i], zeros[i]]);
    /** @const {!Array<!bigint>} */
    this.zeros = zeros;
  }

  /**
   * @param {BinaryKey} key
   * @return {!bigint}
   */
  getNode(key) { return this.nodes[key] || this.zeros[key.length]; }

  /**
   * @param {BinaryKey} key
   * @param {!bigint} val
   * @return {!bigint} the root after insertion
   */
  setLeaf(key, val) {
    for (; ;) {
      this.nodes[key] = val;
      if (!key) return val;
      const isLeft = key.slice(-1) == "0";
      key = key.slice(0, -1);
      const sibling = this.getNode(key + (+isLeft));
      val = poseidon(isLeft ? [val, sibling] : [sibling, val]);
    }
  }

  /**
   * @param {BinaryKey} key
   * @return {!Array<mina.Witness>}
   */
  getWitness(key) {
    /** @const {!Array<mina.Witness>} */
    const witness = Array(this.height);
    for (let d = 0; key; ++d) {
      const isLeft = key.slice(-1) == "0";
      key = key.slice(0, -1);
      witness[d] = {
        isLeft,
        sibling: this.getNode(key + (+isLeft))
      };
    }
    return witness;
  }
}

export { BinaryKey, MerkleTree, hexToBinary };

import { poseidon } from "../crypto/poseidon";

/** @const {number} */
const Height = 32;

/** @typedef {string} */
const BinaryKey = {};

/**
 * @param {string} key
 * @return {BinaryKey}
 */
const hexToBinary = (key) => { }

class MerkleTree {
  constructor() {
    /**
     * @private
     * @const {!Object<string, !bigint>}
     */
    this.nodes = {};
    /** @const {!Array<!bigint>} */
    const zeros = Array(Height + 1);
    /** @const {!Array<!bigint>} */
    zeros[32] = 0n;
    for (let i = Height; i > 0; --i)
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
    while (key) {
      this.nodes[key] = val;
      const isLeft = key.slice(-1) == "0";
      key = key.slice(0, -1);
      const sibling = this.getNode(key + (isLeft ? "1" : "0"));
      val = poseidon(isLeft ? [val, sibling] : [sibling, val]);
    }
    return val;
  }

  /**
   * @param {BinaryKey} key
   * @return {!Array<mina.Witness>}
   */
  getWitness(key) {
    /** @const {!Array<mina.Witness>} */
    const witness = Array(Height);
    while (key) {
      const isLeft = key.slice(-1) == "0";
      const h = Height - key.length;
      key = key.slice(0, -1);
      witness[h] = {
        isLeft,
        sibling: this.getNode(key + (isLeft ? "1" : "0"))
      };
    }
    return witness;
  }
}

export { BinaryKey, MerkleTree, hexToBinary };

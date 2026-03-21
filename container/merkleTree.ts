type HexKey = string;

type BinaryKey = string;

type Value = bigint;

type Witness = {
  isLeft: boolean;
  sibling: bigint;
};

interface MerkleTree {
  setLeaf(key: HexKey, value: bigint): bigint | Promise<bigint>;
  /** @pure */
  getNode(key: BinaryKey): bigint | Promise<bigint>;
  /** @pure */
  getWitness(key: HexKey): Witness[] | Promise<Witness[]>;
}

export {
  BinaryKey,
  HexKey,
  MerkleTree,
  Value,
  Witness
};

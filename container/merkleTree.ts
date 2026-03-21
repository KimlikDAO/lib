type HexKey = string;

type BinaryKey = string;

type Value = BigInt;

type Witness = {
  isLeft: boolean;
  sibling: bigint;
};

interface MerkleTree {
  getNode(key: BinaryKey): bigint | Promise<bigint>;
  getWitness(key: HexKey): Witness[] | Promise<Witness[]>;
  setLeaf(key: HexKey, value: bigint): bigint | Promise<bigint>;
}

export {
  BinaryKey,
  HexKey,
  MerkleTree,
  Value,
  Witness
};

type BinaryKey = string;

interface Map<K, V> {
  set(key: K, value: V): V | undefined;
  /** @pure */
  get(key: K): V | undefined;
}

interface Witness<V> {
  isLeft: boolean;
  sibling: V;
};

interface Witnessed<V> {
  value: V | undefined;
  root: V;
  witness: Witness<V>[];
}

interface MerkleMap<K, V> extends Map<K, V> {
  /** @pure */
  getInner(key: BinaryKey): V;
  /** @pure */
  getWitnessed(key: K): Witnessed<V>;
}

export {
  BinaryKey,
  MerkleMap,
  Witness,
  Witnessed
};

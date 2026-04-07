import { FreshValue } from "@kimlikdao/kdts";

type BinaryKey = string;

interface Map<K, V extends FreshValue> {
  set(key: K, value: V): V | undefined;
  /** @satisfies {PureFn} */
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
  /** @satisfies {PureFn} */
  getInner(key: BinaryKey): V;
  /** @satisfies {PureFn} */
  getWitnessed(key: K): Witnessed<V>;
}

export {
  BinaryKey,
  MerkleMap,
  Witness,
  Witnessed
};

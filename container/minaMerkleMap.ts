import { poseidon } from "../crypto/minaPoseidon";
import hex from "../util/hex";
import {
  BinaryKey,
  MerkleMap,
  Witness,
  Witnessed
} from "./merkleMap";

type Field = string | bigint;
type Value = bigint;

class MinaMerkleMap implements MerkleMap<Field, Value> {
  private nodes: Record<string, bigint> = {};
  private zeros: readonly bigint[];

  constructor(private height: number) {
    const zeros: bigint[] = Array(height + 1);
    zeros[height] = 0n;
    for (let i = height; i > 0; --i)
      zeros[i - 1] = poseidon([zeros[i], zeros[i]]);
    this.zeros = zeros;
  }

  static toBinaryKey(key: Field, height: number): BinaryKey {
    if (typeof key == "bigint")
      key = key.toString(16);
    else if (key.startsWith("0x"))
      key = key.slice(2);
    return hex.toBinary(key).padStart(height, "0").slice(0, height);
  }

  set(key: Field, val: Value): Value | undefined {
    let h = this.height;
    key = MinaMerkleMap.toBinaryKey(key, h);
    const oldVal: Value | undefined = this.nodes[key];
    for (; ; --h) {
      this.nodes[key] = val;
      if (!key) return oldVal;
      const isLeft = key.charCodeAt(key.length - 1) == 48; // 0
      key = key.slice(0, -1);
      const sibling = this.nodes[key + +isLeft] ?? this.zeros[h];
      val = poseidon(isLeft ? [val, sibling] : [sibling, val]);
    }
  }
  /** @satisfies {PureFn} */
  get(key: Field): Value | undefined {
    key = MinaMerkleMap.toBinaryKey(key, this.height);
    return this.nodes[key];
  }

  /** @satisfies {PureFn} */
  getInner(key: BinaryKey): Value {
    return this.nodes[key] ?? this.zeros[key.length];
  }
  /** @satisfies {PureFn} */
  getWitnessed(key: Field): Witnessed<Value> {
    const h = this.height;
    key = MinaMerkleMap.toBinaryKey(key, h);
    const value = this.nodes[key];
    const witness: Witness<Value>[] = Array(h);
    for (let d = 0; key; ++d) {
      const isLeft = key.charCodeAt(key.length - 1) == 48;
      key = key.slice(0, -1);
      const sibling = this.nodes[key + +isLeft] ?? this.zeros[h - d];
      witness[d] = { isLeft, sibling } as Witness<Value>;
    }
    const root = this.nodes[""] ?? this.zeros[0];
    return { value, witness, root } as Witnessed<Value>;
  }
}

export { MinaMerkleMap };

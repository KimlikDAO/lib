import { expect, test } from "bun:test";
import { poseidon } from "../../crypto/minaPoseidon";
import { BinaryKey, HexKey, MinaMerkleTree } from "../merkleTree";

test("test set and get leaf", () => {
  const tree = new MinaMerkleTree(32);

  tree.setLeaf(HexKey("0"), 31n);
  expect(tree.getNode(BinaryKey("0".repeat(32)))).toBe(31n);
});

test("test node consistency", () => {
  const tree = new MinaMerkleTree(32);
  tree.setLeaf(HexKey("F"), 31n);

  const fifteen = "0".repeat(28) + "1111";

  expect(tree.getNode(fifteen.slice(0, -1)))
    .toBe(poseidon([0n, 31n]));
  expect(tree.getNode(fifteen.slice(0, -2)))
    .toBe(poseidon([poseidon([0n, 0n]), poseidon([0n, 31n])]));

  tree.setLeaf(HexKey("E"), 69n);

  expect(tree.getNode(fifteen.slice(0, -1)))
    .toBe(poseidon([69n, 31n]));
  expect(tree.getNode(fifteen.slice(0, -2)))
    .toBe(poseidon([poseidon([0n, 0n]), poseidon([69n, 31n])]));
});

test("test get witness", () => {
  const tree = new MinaMerkleTree(32);

  const zeroWitness = tree.zeros.slice(1).reverse();
  expect(tree.getWitness(HexKey("00000000")).map((w) => w.sibling))
    .toEqual(zeroWitness);

  const t4 = new MinaMerkleTree(4);
  t4.setLeaf(HexKey("E"), 31n);

  expect(t4.getWitness(HexKey("F")).map((w) => w.sibling))
    .toEqual([31n, t4.zeros[3], t4.zeros[2], t4.zeros[1]]);

  t4.setLeaf(HexKey("D"), 30n);

  expect(t4.getWitness(HexKey("F")).map((w) => w.sibling))
    .toEqual([31n, poseidon([0n, 30n]), t4.zeros[2], t4.zeros[1]]);

  t4.setLeaf(HexKey("B"), 28n);

  expect(t4.getWitness(HexKey("F")).map((w) => w.sibling))
    .toEqual([
      31n,
      poseidon([0n, 30n]),
      poseidon([t4.zeros[3], poseidon([0n, 28n])]),
      t4.zeros[1]
    ]);

  expect(t4.getWitness(HexKey("E")).map((w) => w.sibling))
    .toEqual([
      0n,
      poseidon([0n, 30n]),
      poseidon([t4.zeros[3], poseidon([0n, 28n])]),
      t4.zeros[1]
    ]);

  expect(t4.getWitness(HexKey("E")).map((w) => w.isLeft))
    .toEqual([true, false, false, false]);
});

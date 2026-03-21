import { expect, test } from "bun:test";
import { poseidon } from "../../crypto/minaPoseidon";
import { MinaMerkleTree } from "../minaMerkleTree";

test("test set and get leaf", () => {
  const tree = new MinaMerkleTree(32);

  tree.setLeaf("0", 31n);
  expect(tree.getNode("0".repeat(32))).toBe(31n);
});

test("test node consistency", () => {
  const tree = new MinaMerkleTree(32);
  tree.setLeaf("F", 31n);

  const fifteen = "0".repeat(28) + "1111";

  expect(tree.getNode(fifteen.slice(0, -1)))
    .toBe(poseidon([0n, 31n]));
  expect(tree.getNode(fifteen.slice(0, -2)))
    .toBe(poseidon([poseidon([0n, 0n]), poseidon([0n, 31n])]));

  tree.setLeaf("E", 69n);

  expect(tree.getNode(fifteen.slice(0, -1)))
    .toBe(poseidon([69n, 31n]));
  expect(tree.getNode(fifteen.slice(0, -2)))
    .toBe(poseidon([poseidon([0n, 0n]), poseidon([69n, 31n])]));
});

test("test get witness", () => {
  const tree = new MinaMerkleTree(32);

  const zeros: bigint[] = Array(33);
  zeros[32] = 0n;
  for (let i = 32; i > 0; --i)
    zeros[i - 1] = poseidon([zeros[i], zeros[i]]);

  const zeroWitness = zeros.slice(1).reverse();
  expect(tree.getWitness("00000000").map((w) => w.sibling))
    .toEqual(zeroWitness);

  const t4 = new MinaMerkleTree(4);
  t4.setLeaf("E", 31n);

  expect(t4.getWitness("F").map((w) => w.sibling))
    .toEqual([31n, zeros[31], zeros[30], zeros[29]]);

  t4.setLeaf("D", 30n);

  expect(t4.getWitness("F").map((w) => w.sibling))
    .toEqual([31n, poseidon([0n, 30n]), zeros[30], zeros[29]]);

  t4.setLeaf("B", 28n);

  expect(t4.getWitness("F").map((w) => w.sibling))
    .toEqual([
      31n,
      poseidon([0n, 30n]),
      poseidon([zeros[31], poseidon([0n, 28n])]),
      zeros[29]
    ]);

  expect(t4.getWitness("E").map((w) => w.sibling))
    .toEqual([
      0n,
      poseidon([0n, 30n]),
      poseidon([zeros[31], poseidon([0n, 28n])]),
      zeros[29]
    ]);

  expect(t4.getWitness("E").map((w) => w.isLeft))
    .toEqual([true, false, false, false]);
});

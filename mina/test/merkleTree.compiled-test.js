import { poseidon } from "../../crypto/poseidon";
import { assertArrayEq, assertEq } from "../../testing/assert";
import { BinaryKey, HexKey, MinaMerkleTree, WitnessElem } from "../merkleTree";

const testSetGetLeaf = () => {
  const tree = new MinaMerkleTree(32);

  tree.setLeaf(HexKey("0"), 31n);
  assertEq(tree.getNode(BinaryKey("0".repeat(32))), 31n);
};

const testNodeConsistency = () => {
  const tree = new MinaMerkleTree(32);
  tree.setLeaf(HexKey("F"), 31n);

  /** @const {HexKey} */
  const fifteen = "0".repeat(28) + "1111";

  assertEq(tree.getNode(fifteen.slice(0, -1)), poseidon([0n, 31n]));
  assertEq(
    tree.getNode(fifteen.slice(0, -2)),
    poseidon([poseidon([0n, 0n]), poseidon([0n, 31n])])
  );

  tree.setLeaf(HexKey("E"), 69n);

  assertEq(tree.getNode(fifteen.slice(0, -1)), poseidon([69n, 31n]));
  assertEq(
    tree.getNode(fifteen.slice(0, -2)),
    poseidon([poseidon([0n, 0n]), poseidon([69n, 31n])])
  );
};

const testGetWitness = () => {
  const tree = new MinaMerkleTree(32);

  const zeroWitness = tree.zeros.slice(1).reverse();
  assertArrayEq(
    tree
      .getWitness(HexKey("00000000"))
      .map((/** @type {WitnessElem} */ w) => w.sibling),
    zeroWitness
  );
};

testSetGetLeaf();
testNodeConsistency();
testGetWitness();

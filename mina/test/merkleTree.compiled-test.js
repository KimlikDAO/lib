import { poseidon } from "../../crypto/poseidon";
import { assertEq, assertArrayEq } from "../../testing/assert";
import { MerkleTree } from "../merkleTree";

const testSetGetLeaf = () => {
  const tree = new MerkleTree();

  const zero = "00000000000000000000000000000000";
  tree.setLeaf(zero, 31n);
  assertEq(tree.getNode(zero), 31n);
}

const testNodeConsistency = () => {
  const tree = new MerkleTree();

  const thirtyOne = "00000000000000000000000000001111";
  tree.setLeaf(thirtyOne, 31n);

  assertEq(tree.getNode(thirtyOne.slice(0, -1)), poseidon([0n, 31n]));
  assertEq(tree.getNode(thirtyOne.slice(0, -2)), poseidon([poseidon([0n, 0n]), poseidon([0n, 31n])]));

  tree.setLeaf("00000000000000000000000000001110", 69n);

  assertEq(tree.getNode(thirtyOne.slice(0, -1)), poseidon([69n, 31n]));
  assertEq(tree.getNode(thirtyOne.slice(0, -2)), poseidon([poseidon([0n, 0n]), poseidon([69n, 31n])]));
}

const testGetWitness = () => {
  const tree = new MerkleTree();
  const zero = "00000000000000000000000000000000";

  const zeroWitness = tree.zeros.slice(1).reverse();
  assertArrayEq(
    tree.getWitness(zero).map((/** @type {!mina.Witness} */ w) => w.sibling),
    zeroWitness
  );
}

testSetGetLeaf();
testNodeConsistency();
testGetWitness();

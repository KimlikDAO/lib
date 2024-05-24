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
    tree.getWitness(HexKey("00000000")).map((/** @type {WitnessElem} */ w) => w.sibling),
    zeroWitness
  );

  const t4 = new MinaMerkleTree(4);
  t4.setLeaf(HexKey("E"), 31n);

  assertArrayEq(
    t4.getWitness(HexKey("F")).map((/** @type {WitnessElem} */ w) => w.sibling),
    [31n, t4.zeros[3], t4.zeros[2], t4.zeros[1]]
  );

  t4.setLeaf(HexKey("D"), 30n);

  assertArrayEq(
    t4.getWitness(HexKey("F")).map((/** @type {WitnessElem} */ w) => w.sibling),
    [31n, poseidon([0n, 30n]), t4.zeros[2], t4.zeros[1]]
  );

  t4.setLeaf(HexKey("B"), 28n);

  assertArrayEq(
    t4.getWitness(HexKey("F")).map((/** @type {WitnessElem} */ w) => w.sibling),
    [31n, poseidon([0n, 30n]), poseidon([t4.zeros[3], poseidon([0n, 28n])]), t4.zeros[1]]
  );

  assertArrayEq(
    t4.getWitness(HexKey("E")).map((/** @type {WitnessElem} */ w) => w.sibling),
    [0n, poseidon([0n, 30n]), poseidon([t4.zeros[3], poseidon([0n, 28n])]), t4.zeros[1]]
  );

  assertArrayEq(
    t4.getWitness(HexKey("E")).map((/** @type {WitnessElem} */ w) => w.isLeft),
    [true, false, false, false]
  );
};

testSetGetLeaf();
testNodeConsistency();
testGetWitness();

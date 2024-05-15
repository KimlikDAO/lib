import { poseidon } from "../../crypto/poseidon";
import { assertArrayEq, assertEq } from "../../testing/assert";
import { MerkleTree } from "../merkleTree";

const testSetGetLeaf = () => {
  const tree = new MerkleTree(32);

  const zero = "00000000000000000000000000000000";
  tree.setLeaf(zero, 31n);
  assertEq(tree.getNode(zero), 31n);
};

const testNodeConsistency = () => {
  const tree = new MerkleTree(32);

  const thirtyOne = "00000000000000000000000000001111";
  tree.setLeaf(thirtyOne, 31n);

  assertEq(tree.getNode(thirtyOne.slice(0, -1)), poseidon([0n, 31n]));
  assertEq(
    tree.getNode(thirtyOne.slice(0, -2)),
    poseidon([poseidon([0n, 0n]), poseidon([0n, 31n])])
  );

  tree.setLeaf("00000000000000000000000000001110", 69n);

  assertEq(tree.getNode(thirtyOne.slice(0, -1)), poseidon([69n, 31n]));
  assertEq(
    tree.getNode(thirtyOne.slice(0, -2)),
    poseidon([poseidon([0n, 0n]), poseidon([69n, 31n])])
  );
};

const testGetWitness = () => {
  const tree = new MerkleTree(32);
  const zero = "00000000000000000000000000000000";

  const zeroWitness = tree.zeros.slice(1).reverse();
  assertArrayEq(
    tree.getWitness(zero).map((/** @type {!mina.Witness} */ w) => w.sibling),
    zeroWitness
  );

  const t2 = new MerkleTree(2);
  t2.setLeaf("00", 12n);
  t2.setLeaf("01", 13n);
  t2.setLeaf("10", 69n);
  t2.setLeaf("11", 31n);

  assertArrayEq(
    t2.getWitness("10").map((x) => x.isLeft),
    [true, false]
  );
  assertArrayEq(
    t2.getWitness("10").map((x) => x.sibling),
    [
      31n,
      19487343630458013507295644599398373169849232092725474255300991353589325709873n,
    ]
  );
};

const testRoot = () => {
  const tree = new MerkleTree(2);

  tree.setLeaf("00", 12n);
  const root = tree.setLeaf("01", 13n);

  assertEq(tree.getNode(""), root);
  assertEq(
    tree.getNode(""),
    24761230160490995408576941661835661171884064004388554675853100205564068190570n
  );

  tree.setLeaf("10", 69n);
  const root2 = tree.setLeaf("11", 31n);

  assertEq(
    root2,
    19896916020666948695671743788555051064473578822640662440592176193110027392115n
  );
  assertEq(tree.getNode(""), root2);
};

testSetGetLeaf();
testNodeConsistency();
testGetWitness();
testRoot();

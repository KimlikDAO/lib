/** @typedef {string} */
const HexKey = String;

/** @typedef {string} */
const BinaryKey = String;

/** @typedef {!bigint} */
const Value = BigInt;

/**
 * @typedef {{
 *   isLeft: boolean,
 *   sibling: Value
 * }}
 */
const WitnessElem = {};

/**
 * @interface
 */
function MerkleTree() { }

/**
 * @param {HexKey} key
 * @return {!Array<WitnessElem>|!Promise<!Array<WitnessElem>>}
 */
MerkleTree.prototype.getWitness = function (key) { };

/**
 * @param {HexKey} key
 * @param {Value} value
 * @return {Value|!Promise<Value>}
 */
MerkleTree.prototype.setLeaf = function (key, value) { };

/**
 * @param {BinaryKey} key
 * @return {Value|!Promise<Value>}
 */
MerkleTree.prototype.getNode = function (key) { };

export { BinaryKey, HexKey, MerkleTree, Value, WitnessElem };

/** @enum {string} */
const ChainId = {
  x1: "0x1",
  x144: "0x144",
  x38: "0x38",
  x406: "0x406",
  x89: "0x89",
  xa4b1: "0xa4b1",
  xa86a: "0xa86a",
  xfa: "0xfa",
  MinaBerkeley: "mina:berkeley",
  MinaMainnet: "mina:mainnet",
  MinaTestnet: "mina:testnet",
};

/** @enum {string} */
const ChainGroup = {
  EVM: "0x",
  MINA: "mi"
};

/**
 * Avoid using `Object.values(ChainGroup)` to iterate and instead prefer
 * iterating over this array. This way the `ChainGroup` enum can be completely
 * optimized away.
 *
 * @const {!Array<ChainGroup>}
 */
const ChainGroups = [ChainGroup.EVM, ChainGroup.MINA];

/**
 * @param {ChainId} id
 * @return {ChainGroup}
 */
const chainIdToGroup = (id) => /** @type {ChainGroup} */(id.slice(2));

export {
  ChainGroup,
  ChainGroups,
  ChainId,
  chainIdToGroup
};

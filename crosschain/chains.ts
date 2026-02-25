const enum ChainId {
  x1 = "0x1",
  x144 = "0x144",
  x38 = "0x38",
  x406 = "0x406",
  x89 = "0x89",
  xa4b1 = "0xa4b1",
  xa86a = "0xa86a",
  xfa = "0xfa",
  MinaBerkeley = "mina:berkeley",
  MinaMainnet = "mina:mainnet",
  MinaTestnet = "mina:testnet",
}

const enum ChainGroup {
  EVM = "0x",
  MINA = "mi",
}

/**
 * Avoid using `Object.values(ChainGroup)` to iterate and instead prefer
 * iterating over this array. This way the `ChainGroup` enum can be completely
 * optimized away.
 */
const ChainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];

const chainIdToGroup = (id: ChainId): ChainGroup =>
  id.slice(0, 2) as ChainGroup;

export {
  ChainGroup,
  ChainGroups,
  ChainId,
  chainIdToGroup,
};

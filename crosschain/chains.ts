import { ChainId as EthereumChainId } from "../ethereum/chains";
import { ChainId as MinaChainId } from "../mina/chains";

type ChainId = MinaChainId | EthereumChainId;

enum ChainGroup {
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
  chainIdToGroup
};

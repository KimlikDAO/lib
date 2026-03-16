import { describe, expect, test } from "bun:test";
import {
  ChainGroup,
  ChainGroups,
  EthereumChainId,
  MinaChainId,
  chainIdToGroup
} from "../chains";

describe("chains", () => {
  test("chainIdToGroup correctly identifies EVM chains", () => {
    expect(chainIdToGroup(EthereumChainId.x1)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(EthereumChainId.x38)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(EthereumChainId.x89)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(EthereumChainId.xa4b1)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(EthereumChainId.xa86a)).toBe(ChainGroup.EVM);
  });

  test("chainIdToGroup correctly identifies Mina chains", () => {
    expect(chainIdToGroup(MinaChainId.Mainnet)).toBe(ChainGroup.MINA);
    expect(chainIdToGroup(MinaChainId.Testnet)).toBe(ChainGroup.MINA);
  });

  test("ChainGroups contains all chain groups", () => {
    expect(Object.values(ChainGroup).length).toBe(ChainGroups.length);
  });
});

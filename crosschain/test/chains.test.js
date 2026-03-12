import { describe, expect, test } from "bun:test";
import { ChainId as EthereumChainId } from "../../ethereum/chains";
import { ChainId as MinaChainId } from "../../mina/chains";
import {
  ChainGroup,
  ChainGroups,
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
    expect(chainIdToGroup(MinaChainId.MinaMainnet)).toBe(ChainGroup.MINA);
    expect(chainIdToGroup(MinaChainId.MinaTestnet)).toBe(ChainGroup.MINA);
  });

  test("ChainGroups contains all chain groups", () => {
    expect(Object.values(ChainGroup).length).toBe(ChainGroups.length);
  });
});

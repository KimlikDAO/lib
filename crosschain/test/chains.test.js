import { describe, expect, test } from "bun:test";
import {
  ChainGroup,
  ChainGroups,
  ChainId,
  chainIdToGroup
} from "../chains";

describe("chains", () => {
  test("chainIdToGroup correctly identifies EVM chains", () => {
    expect(chainIdToGroup(ChainId.x1)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(ChainId.x38)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(ChainId.x89)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(ChainId.xa4b1)).toBe(ChainGroup.EVM);
    expect(chainIdToGroup(ChainId.xa86a)).toBe(ChainGroup.EVM);
  });

  test("chainIdToGroup correctly identifies Mina chains", () => {
    expect(chainIdToGroup(ChainId.MinaBerkeley)).toBe(ChainGroup.MINA);
    expect(chainIdToGroup(ChainId.MinaMainnet)).toBe(ChainGroup.MINA);
    expect(chainIdToGroup(ChainId.MinaTestnet)).toBe(ChainGroup.MINA);
  });

  test("ChainGroups contains all chain groups", () => {
    expect(Object.values(ChainGroup).length).toBe(ChainGroups.length);
  });
});

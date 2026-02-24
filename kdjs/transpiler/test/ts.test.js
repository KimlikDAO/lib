import { expect, test } from "bun:test";
import { transpileTs } from "../ts";

test("enums and variables", () => {
  const input = `
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

const ChainGroups: readonly ChainGroup[] = [ChainGroup.EVM, ChainGroup.MINA];

const chainIdToGroup = (id: ChainId): ChainGroup => (id.slice(0, 2) as ChainGroup);

export { ChainId, ChainGroup, ChainGroups, chainIdToGroup };
`;
  const result = transpileTs(input);
  expect(result).toBe(
`/** @enum {string} */
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
  MinaTestnet: "mina:testnet"
};
/** @enum {string} */
const ChainGroup = {
  EVM: "0x",
  MINA: "mi"
};
/** @const {readonly ChainGroup[]} */
const ChainGroups = [ChainGroup.EVM, ChainGroup.MINA];
const chainIdToGroup = (id) => /** @type {ChainGroup} */(unknown);

export {
  ChainId,
  ChainGroup,
  ChainGroups,
  chainIdToGroup
};
`);
});

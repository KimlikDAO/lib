import { describe, expect, it } from "bun:test";
import { ethers } from "ethers";
import { ChainId } from "../../../crosschain/chains";
import { ERC20Permit } from "../ERC20";
import { TokenCode, Tokens } from "../tokens";

/**
 * Compute EIP-712 domain separator for an ERC20Permit token and compare to golden.
 * @param {ERC20Permit} token
 * @param {string} goldenHex
 */
const expectDomainSeparator = (token, goldenHex) => {
  const domain = {
    name: token.name,
    version: "" + token.version,
    chainId: token.chainId,
    verifyingContract: token.contract
  };
  const hash = ethers.TypedDataEncoder.hashDomain(domain);
  expect(hash).toBe(goldenHex);
};

describe("DOMAIN_SEPARATOR (EIP-712) vs golden", () => {
  it("0xa86a Avalanche C-Chain permit tokens", () => {
    expectDomainSeparator(
      /** @type {ERC20Permit} */(Tokens[ChainId.xa86a][TokenCode.USDT]),
      "0xf6d4d20bf85d69d29f5cd682e5fb2884425e4aa291bb7318e203fd68c96cc0f4"
    );
    expectDomainSeparator(
      /** @type {ERC20Permit} */(Tokens[ChainId.xa86a][TokenCode.USDC]),
      "0xbbea200329a938bc3438984a49cb0732e66d66d7bd59c127abacc1710e77f7b3"
    );
  });

  it("0xa4b1 Arbitrum One permit tokens", () => {
    expectDomainSeparator(
      /** @type {ERC20Permit} */(Tokens[ChainId.xa4b1][TokenCode.USDT]),
      "0xac9d14034394f4b1d4bb6a20191a30c20faf508b6c4670e931b954eb281b8a33"
    );
    expectDomainSeparator(
      /** @type {ERC20Permit} */(Tokens[ChainId.xa4b1][TokenCode.USDC]),
      "0xa074269f06a6961e917f3c53d7204a31a08aec9a5f4a5801e8a8f837483b62a0"
    );
  });

  it("0x1 Ethereum USDC permit", () => {
    expectDomainSeparator(
      /** @type {ERC20Permit} */(Tokens[ChainId.x1][TokenCode.USDC]),
      "0x06c37168a7db5138defc7866392bb87a741f9b3d104deb5094588ce041cae335"
    );
  });
});

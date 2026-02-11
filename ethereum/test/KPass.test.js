import { describe, expect, it } from "bun:test";
import { ethers } from "ethers";
import { ChainId } from "../../crosschain/chains";
import KPass, { TokenData, TokenInfo } from "../KPass";

/**
 * @param {!TokenInfo} tokenInfo
 * @param {!ChainId} chainId
 * @param {string} domainSeparator
 */
const checkDomainSeparator = (tokenInfo, chainId, domainSeparator) => {
  expect(ethers.TypedDataEncoder.hashDomain({
    name: tokenInfo.uzunAd,
    version: "" + tokenInfo.sürüm,
    chainId,
    verifyingContract: tokenInfo.adres,
  })).toBe(domainSeparator);
}

describe("0xa86a DOMAIN_SEPARATOR() check", () => {
  it("should be equal to the on-chain DOMAIN_SEPARATOR()", () => {
    checkDomainSeparator(/** @type {!TokenInfo} */(TokenData[ChainId.xa86a][1]),
      ChainId.xa86a,
      "0xf6d4d20bf85d69d29f5cd682e5fb2884425e4aa291bb7318e203fd68c96cc0f4");

    checkDomainSeparator(/** @type {!TokenInfo} */(TokenData[ChainId.xa86a][2]),
      ChainId.xa86a,
      "0xbbea200329a938bc3438984a49cb0732e66d66d7bd59c127abacc1710e77f7b3");

    checkDomainSeparator(/** @type {!TokenInfo} */(TokenData[ChainId.xa86a][3]),
      ChainId.xa86a,
      "0x039e8aca8365b03d156cc819454c50146e9ad567b9929912528d9f270de1117a");
  });
});

describe("0x1 DOMAIN_SEPARATOR() check", () => {
  it("should be equal to the on-chain DOMAIN_SEPARATOR()", () => {
    checkDomainSeparator(/** @type {!TokenInfo} */(TokenData[ChainId.x1][2]),
      ChainId.x1,
      "0x06c37168a7db5138defc7866392bb87a741f9b3d104deb5094588ce041cae335");
  });
});

describe("0xa4b1 DOMAIN_SEPARATOR() check", () => {
  it("should be equal to the on-chain DOMAIN_SEPARATOR()", () => {
    checkDomainSeparator(/** @type {!TokenInfo} */(TokenData[ChainId.xa4b1][1]),
      ChainId.xa4b1,
      "0xac9d14034394f4b1d4bb6a20191a30c20faf508b6c4670e931b954eb281b8a33");
  });

  it("should be equal to the on-chain DOMAIN_SEPARATOR()", () => {
    checkDomainSeparator(/** @type {!TokenInfo} */(TokenData[ChainId.xa4b1][2]),
      ChainId.xa4b1,
      "0xa074269f06a6961e917f3c53d7204a31a08aec9a5f4a5801e8a8f837483b62a0");
  })
});

describe("Test accepted payment tokens", () => {
  it("should list available tokens", () => {
    expect(KPass.isTokenAvailable(ChainId.xa86a, 1)).toBeTrue();
  });

  it("should list ERC20 tokens", () => {
    expect(KPass.isTokenERC20Permit(ChainId.x1, 1)).toBeFalse();
    expect(KPass.isTokenERC20Permit(ChainId.x1, 2)).toBeTrue();
    expect(KPass.isTokenERC20Permit(ChainId.xa86a, 1)).toBeTrue();
  })
});

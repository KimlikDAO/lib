import { expect, test } from "bun:test";
import { ChainId } from "../../chains";
import { domainSeparator } from "../EIP712";
import { EIP712DomainData } from "../EIP712.d";
import { ERC20Permit } from "../ERC20Permit";
import { TokenCode, Tokens } from "../tokens";

const tokenToDomainData = (token: ERC20Permit): EIP712DomainData => ({
  name: token.name,
  version: "" + token.version,
  chainId: token.chainId,
  verifyingContract: token.contract,
});

test("0xa86a USDT", () => {
  const token = Tokens[ChainId.xa86a][TokenCode.USDT] as ERC20Permit;
  expect(domainSeparator(tokenToDomainData(token))).toBe(
    "f6d4d20bf85d69d29f5cd682e5fb2884425e4aa291bb7318e203fd68c96cc0f4");
});

test("0xa86a USDC", () => {
  const token = Tokens[ChainId.xa86a][TokenCode.USDC] as ERC20Permit;
  expect(domainSeparator(tokenToDomainData(token))).toBe(
    "bbea200329a938bc3438984a49cb0732e66d66d7bd59c127abacc1710e77f7b3");
});

test("0xa4b1 USDT", () => {
  const token = Tokens[ChainId.xa4b1][TokenCode.USDT] as ERC20Permit;
  expect(domainSeparator(tokenToDomainData(token))).toBe(
    "ac9d14034394f4b1d4bb6a20191a30c20faf508b6c4670e931b954eb281b8a33");
});

test("0xa4b1 USDC", () => {
  const token = Tokens[ChainId.xa4b1][TokenCode.USDC] as ERC20Permit;
  expect(domainSeparator(tokenToDomainData(token))).toBe(
    "a074269f06a6961e917f3c53d7204a31a08aec9a5f4a5801e8a8f837483b62a0");
});

test("0x1 USDC", () => {
  const token = Tokens[ChainId.x1][TokenCode.USDC] as ERC20Permit;
  expect(domainSeparator(tokenToDomainData(token))).toBe(
    "06c37168a7db5138defc7866392bb87a741f9b3d104deb5094588ce041cae335");
});

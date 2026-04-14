import { expect, test } from "bun:test";
import { ethers, TypedDataDomain } from "ethers";
import { ChainId } from "../../chains";
import { MockProvider } from "../../mock/provider";
import { Signature } from "../../signature.d";
import { signerAddress } from "../../signer";
import { ERC20Permit } from "../ERC20Permit";
import { TokenCode, Tokens } from "../tokens";

test("ERC20Permit create and verify permit", async () => {
  const token = Tokens[ChainId.xa86a][TokenCode.USDC] as ERC20Permit;
  const privKey = 1n;
  const provider = new MockProvider(privKey);
  const owner = provider.getAddress();
  const spender = "0x0000000000000000000000000000000000000001";
  const value = 0n;
  const duration = 3600;

  const permitData = await token.createPermit(provider, owner, spender, value, duration);
  const deadlineHex = permitData.slice(0, 12);
  const sig = permitData.slice(-128) as Signature;

  const types = {
    "Permit": [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };
  const domain: TypedDataDomain = {
    name: token.name,
    version: "" + token.version,
    chainId: parseInt(token.chainId, 16),
    verifyingContract: token.contract
  };
  const message: Record<string, unknown> = {
    "owner": owner,
    "spender": spender,
    "value": value,
    "nonce": 0,
    "deadline": BigInt("0x" + deadlineHex)
  };

  const digestHex = ethers.TypedDataEncoder.hash(domain, types, message);
  const recovered = signerAddress(digestHex.slice(2), sig);
  expect(recovered.toLowerCase()).toBe(owner.toLowerCase());
});

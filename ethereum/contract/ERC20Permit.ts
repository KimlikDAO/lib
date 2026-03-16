import abi from "../abi";
import { Address, PackedAddress } from "../address.d";
import { ChainId } from "../chains";
import { Provider } from "../provider";
import signature from "../signature";
import { Signature, WideSignature } from "../signature.d";
import { EIP712TypedData } from "./EIP712.d";
import { ERC20 } from "./ERC20";

/**
 * 3x256 bit packed permit data.
 *  96 bits: deadline
 * 160 bits: {@link PackedAddress}
 * 512 bits: {@link Signature}
 */
type PermitData = string;

class ERC20Permit extends ERC20 {
  constructor(
    chainId: ChainId,
    contract: Address,
    readonly name: string,
    readonly version: number,
    decimals?: number
  ) {
    super(chainId, contract, decimals);
  }
  nonces(provider: Provider, owner: Address): Promise<string> {
    return provider
      .read({
        chainId: this.chainId,
        to: this.contract,
        data: "0x7ecebe00" + abi.address(owner)
      }) as Promise<string>;
  }
  createPermit(
    provider: Provider,
    owner: Address,
    spender: Address,
    value: bigint,
    duration: number
  ): Promise<PermitData> {
    const deadline = ((Date.now() / 1000 | 0) + duration).toString(16);
    return provider
      .signData(owner, {
        types: {
          "EIP712Domain": [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          "Permit": [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
          ]
        },
        domain: {
          name: this.name,
          version: "" + this.version,
          chainId: this.chainId,
          verifyingContract: this.contract
        },
        primaryType: "Permit",
        message: {
          "owner": owner,
          "spender": spender,
          "value": "0x" + value.toString(16),
          "nonce": "0x0",
          "deadline": "0x" + deadline
        }
      } as EIP712TypedData)
      .then((sig: WideSignature) =>
        deadline.padStart(12, "0") + abi.address(this.contract) + signature.fromWide(sig)
      );
  }
}

export { ERC20Permit };

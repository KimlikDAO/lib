import abi from "../abi";
import { Address } from "../address.d";
import { ChainId } from "../chains";
import { Provider } from "../provider";

class ERC20 {
  constructor(
    readonly chainId: ChainId, readonly contract: Address, readonly decimals = 6
  ) { }

  allowance(provider: Provider, owner: Address, spender: Address): Promise<string> {
    return provider.read({
      chainId: this.chainId,
      to: this.contract,
      data: "0xdd62ed3e" + abi.address(owner) + abi.address(spender)
    });
  }
  approve(provider: Provider, spender: Address, amount: bigint): Promise<string> {
    return provider.write({
      chainId: this.chainId,
      to: this.contract,
      data: "0x095ea7b3" + abi.address(spender) + abi.uint256(amount)
    });
  }
  balanceOf(provider: Provider, owner: Address): Promise<string> {
    return provider.read({
      chainId: this.chainId,
      to: this.contract,
      data: "0x70a08231" + abi.address(owner)
    });
  }
}

export { ERC20 };

import abi from "../abi";
import { Address } from "../address.d";
import { ChainId } from "../chains";
import { Provider } from "../provider";
import { Contract } from "./contracts";

class ERC20 extends Contract {
  constructor(chainId: ChainId, contract: Address, readonly decimals = 6) {
    super(chainId, contract);
  }

  allowance(provider: Provider, owner: Address, spender: Address): Promise<string> {
    return this.read(provider,
      "0xdd62ed3e" + abi.address(owner) + abi.address(spender));
  }
  approve(provider: Provider, spender: Address, amount: bigint): Promise<string> {
    return this.write(provider,
      "0x095ea7b3" + abi.address(spender) + abi.uint256(amount));
  }
  balanceOf(provider: Provider, owner: Address): Promise<string> {
    return this.read(provider,
      "0x70a08231" + abi.address(owner));
  }
}

export { ERC20 };

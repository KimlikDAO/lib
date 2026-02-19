import { ChainId } from "../../crosschain/chains";
import abi from "../abi";
import { Address } from "../address.d";
import { Provider } from "../provider";

class ERC20 {
  /**
   * @param {ChainId} chainId
   * @param {Address} contract
   * @param {number=} decimals
   */
  constructor(chainId, contract, decimals = 6) {
    /** @const {ChainId} */
    this.chainId = chainId;
    /** @const {Address} */
    this.contract = contract;
    /** @const {number} */
    this.decimals = decimals;
  }

  /**
   * @param {Provider} provider
   * @param {Address} owner
   * @param {Address} spender
   * @return {Promise<string>}
   */
  allowance(provider, owner, spender) {
    return provider.read({
      chainId: this.chainId,
      to: this.contract,
      data: "0xdd62ed3e" + abi.address(owner) + abi.address(spender)
    });
  }

  /**
   * @param {Provider} provider
   * @param {Address} spender
   * @param {bigint=} amount
   * @return {Promise<string>}
   */
  approve(provider, spender, amount = 0n) {
    return provider.write({
      chainId: this.chainId,
      to: this.contract,
      data: "0x095ea7b3" + abi.address(spender)
        + (amount ? abi.uint256(amount) : abi.Uint256Max)
    });
  }
}

export { ERC20 };

import { ChainId } from "../crosschain/chains";
import abi from "./abi";
import { Address } from "./address.d";
import { Provider } from "./provider";
import { Transaction } from "./transaction.d";

class ERC20 {
  /**
   * @param {ChainId} chainId
   * @param {Address} contract
   * @param {number} decimals
   */
  constructor(chainId, contract, decimals) {
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
    return provider.read(/** @type {Transaction} */({
      chainId: this.chainId,
      to: this.contract,
      data: "0xdd62ed3e" + abi.address(owner) + abi.address(spender)
    }));
  } 
}

class ERC20Permit extends ERC20 {
  /**
   * @param {ChainId} chainId
   * @param {Address} contract
   * @param {string} name
   * @param {number} decimals
   * @param {number} version
   */
  constructor(chainId, contract, name, decimals, version) {
    super(chainId, contract, decimals);
    /** @const {string} */
    this.name = name;
    /** @const {number} */
    this.version = version;
  }

  /**
   * @param {Provider} provider
   * @param {Address} owner
   * @return {Promise<string>}
   */
  nonces(provider, owner) {
    return /** @type {Promise<string>} */(provider.read(
      /** @type {Transaction} */({
        chainId: this.chainId,
        to: this.contract,
        data: "0x7ecebe00" + abi.address(owner)
      })
    ));
  }
}

export {
  ERC20,
  ERC20Permit
};

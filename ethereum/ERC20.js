import jsonrpc from "../api/jsonrpc";
import { address } from "./provider";
import "./transaction.d";

class ERC20 {
  /**
   * @param {string} rpcUrl
   * @param {string} contract
   */
  constructor(rpcUrl, contract) {
    /** @const {string} */
    this.rpcUrl = rpcUrl;
    /** @const {string} */
    this.contact = contract;
  }

  /**
   * @param {string} owner
   * @param {string} spender
   * @return {!Promise<string>}
   */
  allowance(owner, spender) {
    return jsonrpc.call(this.rpcUrl, "eth_call", [
      /** @type {!eth.Transaction} */({
        to: this.contact,
        data: "0xdd62ed3e" + address(owner) + address(spender)
      }),
      "latest"
    ]);
  }
}

export { ERC20 };

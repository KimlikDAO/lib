import { RequestArguments } from "./provider.d";
import { Transaction } from "./transaction.d";

class Provider {
  /**
   * @param {(params: RequestArguments) => Promise<unknown>} request
   */
  constructor(request) {
    /** @const {(params: RequestArguments) => Promise<unknown>} */
    this.request = request;
  }

  /**
   * @param {Transaction} tx
   * @return {Promise<string>}
   */
  read(tx) {
    return /** @type {Promise<string>} */(this.request(
      /** @type {RequestArguments} */({
        method: "eth_call",
        params: [tx, "latest"]
      })
    ));
  }
}

export {
  Provider
};

import { Address } from "./address.d";
import { RequestArguments } from "./provider.d";
import { WideSignature } from "./signature.d";
import { serialize, TransactionRequest } from "./transaction";
import { TransactionHash } from "./transaction.d";

class Provider {
  /**
   * @param {(params: RequestArguments) => Promise<unknown>} request
   */
  constructor(request) {
    /** @const {(params: RequestArguments) => Promise<unknown>} */
    this.request = request;
  }

  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<string>}
   */
  read(txRequest) {
    const tx = serialize(txRequest);
    return /** @type {Promise<string>} */(this.request(
      /** @type {RequestArguments} */({
        method: "eth_call",
        params: [tx, "latest"]
      })
    ));
  }

  /**
   * @param {TransactionRequest} txRequest
   * @return {Promise<TransactionHash>}
   */
  write(txRequest) {
    const tx = serialize(txRequest);
    return /** @type {Promise<string>} */(this.request(
      /** @type {RequestArguments} */({
        method: "eth_sendTransaction",
        params: [tx]
      })
    ));
  }

  /**
   * @param {TransactionHash} txHash 
   * @param {() => void} then 
   */
  whenWritten(txHash, then) {
    const interval = setInterval(() =>
      this.request(
        /** @type {RequestArguments} */({
          method: "eth_getTransactionReceipt",
          params: [txHash]
        })
      ).then((receipt) => {
        if (receipt) {
          clearInterval(interval);
          then();
        }
      }),
      1000);
  }

  /**
   * @param {Address} address
   * @param {Object} typedData EIP-712 typed data
   * @return {Promise<WideSignature>}
   */
  signData(address, typedData) {
    return /** @type {Promise<WideSignature>} */(this.request(
      /** @type {RequestArguments} */({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(typedData)]
      })));
  }
}

export { Provider };

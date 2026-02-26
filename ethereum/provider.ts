import { Address } from "./address.d";
import { EIP712TypedData } from "./contract/EIP712.d";
import { RequestArguments } from "./provider.d";
import { WideSignature } from "./signature.d";
import { serialize, TransactionRequest } from "./transaction";
import { TransactionHash } from "./transaction.d";

interface Provider {
  read(txRequest: TransactionRequest): Promise<string>;
  write(txRequest: TransactionRequest): Promise<TransactionHash>;
  whenWritten(txHash: TransactionHash, then: () => void): void;
  signData(address: Address, typedData: EIP712TypedData): Promise<WideSignature>;
}

class RemoteProvider implements Provider {
  constructor(readonly request: (params: RequestArguments) => Promise<unknown>) {
    this.request = request;
  }

  read(txRequest: TransactionRequest): Promise<string> {
    const tx = serialize(txRequest);
    return this.request({
      method: "eth_call",
      params: [tx, "latest"]
    } as RequestArguments) as Promise<string>;
  }

  write(txRequest: TransactionRequest): Promise<TransactionHash> {
    const tx = serialize(txRequest);
    return this.request({
      method: "eth_sendTransaction",
      params: [tx]
    } as RequestArguments) as Promise<TransactionHash>;
  }

  whenWritten(txHash: TransactionHash, then: () => void): void {
    const interval = setInterval(() =>
      this.request({
        method: "eth_getTransactionReceipt",
        params: [txHash]
      } as RequestArguments
      ).then((receipt) => {
        if (receipt) {
          clearInterval(interval);
          then();
        }
      }),
      1000);
  }

  signData(address: Address, typedData: EIP712TypedData): Promise<WideSignature> {
    return this.request({
      method: "eth_signTypedData_v4",
      params: [address, JSON.stringify(typedData)]
    } as RequestArguments) as Promise<WideSignature>;
  }
}

export { Provider, RemoteProvider };

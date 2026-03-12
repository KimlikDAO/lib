import { Address } from "../address.d";
import { typedDataHash } from "../contract/EIP712";
import { EIP712TypedData } from "../contract/EIP712.d";
import { Provider } from "../provider";
import { WideSignature } from "../signature.d";
import { TransactionRequest } from "../transaction";
import { TransactionHash } from "../transaction.d";
import { addr, signWide } from "./signer";

class MockProvider implements Provider {
  constructor(readonly privKey: bigint) {}

  read(_: TransactionRequest): Promise<string> {
    return Promise.resolve("");
  }

  write(_: TransactionRequest): Promise<TransactionHash> {
    return Promise.resolve("");
  }

  whenWritten(_: TransactionHash, _then: () => void): void { }

  signData(address: Address, typedData: EIP712TypedData): Promise<WideSignature> {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    const digest = BigInt("0x" + typedDataHash(typedData));
    return Promise.resolve(signWide(digest, this.privKey));
  }

  getAddress(): Address {
    return addr(this.privKey);
  }
}

export { MockProvider };

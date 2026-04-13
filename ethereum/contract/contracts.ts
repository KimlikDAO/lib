import { Address } from "../address.d";
import { ChainId } from "../chains";
import { Provider } from "../provider";

class Contract {
  constructor(readonly chainId: ChainId, readonly contract: Address) { }

  read(provider: Provider, data: string): Promise<string> {
    return provider.read({
      chainId: this.chainId,
      to: this.contract,
      data
    });
  }
  write(provider: Provider, data: string): Promise<string> {
    return provider.write({
      chainId: this.chainId,
      to: this.contract,
      data
    })
  }
}

export { Contract };

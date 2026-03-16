import { Address } from "../address.d";
import { ChainId } from "../chains";
import { Provider } from "../provider";

interface SoulboundNFT {
  contract: Address;
  provider: Provider;

  setProvider(provider: Provider): void;
  handleOf(chainId: ChainId, address: Address): Promise<string>;
}

export { SoulboundNFT };

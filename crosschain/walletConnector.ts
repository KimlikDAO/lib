import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
import { Provider as MinaProvider } from "../mina/provider.d";
import { ChainId } from "./chains";
import { Signer } from "./signer";

type Provider = MinaProvider | EthereumProvider;

interface WalletConnector extends Signer {
  isInitialized(): boolean;

  setProvider(provider: Provider): void;

  downloadURL(): string;

  connect(
    chain: ChainId,
    chainChanged: (chainId: ChainId) => void,
    addressChanged: (addresses: string[]) => void,
    onlyIfApproved?: boolean
  ): Promise<void> | void;

  disconnect(): void;

  switchChain(chainId: ChainId): Promise<unknown> | void;

  isChainSupported(chainId: ChainId): boolean;
}

export { Provider, WalletConnector };

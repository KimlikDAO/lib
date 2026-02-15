
/**
 * @see https://eips.ethereum.org/EIPS/eip-1193
 * @see https://nodejs.org/api/events.html for the EventEmitter interface
 * 
 * Ethereum provider interface.
 */
interface EIP1193Provider {
  request(params: RequestArguments): Promise<unknown>;
  on(eventName: string, handler: (event: any) => void): EIP1193Provider;
  removeListener(eventName: string, handler: (event: any) => void): EIP1193Provider;
  removeAllListeners(): EIP1193Provider;
}

interface RequestArguments {
  readonly method: string;
  readonly params?: unknown[]; // original definition is readonly unknown[]
}

interface ProviderRpcError {
  readonly message: string;
  readonly code: number;
  readonly data: unknown;
}

interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

interface SwitchChainParam {
  readonly chainId: string;
}

interface AddChainParam {
  readonly chainId: string;
  readonly chainName: string;
  readonly nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  readonly rpcUrls: string[];
  readonly blockExplorerUrls: string[];
}

interface WatchAssetParamOptions {
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly image: string;
  readonly tokenId: string;
}

interface WatchAssetParam {
  readonly type: string;
  readonly options: WatchAssetParamOptions;
}

interface EIP6963ProviderInfo {
  readonly uuid: string;
  readonly name: string;
  readonly icon: string;
  readonly rdns: string;
}

interface EIP6963ProviderDetail {
  readonly provider: EIP1193Provider;
  readonly info: EIP6963ProviderInfo;
}

export {
  AddChainParam,
  EIP1193Provider,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
  ProviderMessage,
  ProviderRpcError,
  RequestArguments,
  SwitchChainParam,
  WatchAssetParam,
  WatchAssetParamOptions,
};

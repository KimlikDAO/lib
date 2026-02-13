/**
 * @fileoverview Externs for an ethereum provider.
 *
 * @author KimlikDAO
 */

/**
 * Ethereum provider interface.
 */
interface Provider {
  request(params: Request): Promise<string> | Promise<string[]>;
}

/**
 * UI provider interface with event handling capabilities.
 */
interface UiProvider extends Provider {
  isConnected(): boolean;
  on(eventName: string, handler: (event: any) => void): void;
  removeAllListeners(): UiProvider;
}

/**
 * Provider error structure.
 */
interface ProviderError {
  readonly message: string;
  readonly code: number;
  readonly data: unknown;
}

/**
 * The container object that is passed to the provider.
 */
interface Request {
  readonly method: string;
  readonly params: Array<any>;
}

/**
 * Parameters for switching chains.
 */
interface SwitchChainParam {
  readonly chainId: string;
}

/**
 * Parameters for adding a new chain.
 */
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

/**
 * The struct that is passed to the wallet to add an asset.
 * Currently most wallets support only ERC20 assets.
 */
interface WatchAssetParam {
  readonly type: string;
}

/**
 * Options for watching an asset.
 */
interface WatchAssetParamOptions {
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly image: string;
  readonly tokenId: string;
}

/**
 * Provider RPC error structure.
 */
interface ProviderRpcError {
  readonly message: string;
  readonly code: number;
  readonly data: unknown;
}

/**
 * Provider information.
 */
interface ProviderInfo {
  readonly uuid: string;
  readonly name: string;
  readonly icon: string;
  readonly rdns: string;
}

/**
 * Provider detail containing provider instance and info.
 */
interface ProviderDetail {
  readonly provider: UiProvider;
  readonly info: ProviderInfo;
}

export {
  Provider,
  UiProvider,
  ProviderError,
  Request,
  SwitchChainParam,
  AddChainParam,
  WatchAssetParam,
  WatchAssetParamOptions,
  ProviderRpcError,
  ProviderInfo,
  ProviderDetail
};

/**
 * @fileoverview Externs for an ethereum provider.
 *
 * @author KimlikDAO
 */

import eth from "./eth.d";

/**
 * @interface
 */
eth.Provider = function () { }

/**
 * @param {eth.Request} params
 * @return {Promise<string>|Promise<string[]>}
 **/
eth.Provider.prototype.request = function (params) { };

/**
 * @interface
 * @extends {eth.Provider}
 */
eth.UiProvider = function () { }

/**
 * @return {boolean}
 */
eth.UiProvider.prototype.isConnected = function () { };

/**
 * @param {string} eventName
 * @param {(event: any) => void} handler
 */
eth.UiProvider.prototype.on = function (eventName, handler) { };

/**
 * @return {eth.UiProvider}
 */
eth.UiProvider.prototype.removeAllListeners = function () { };

/**
 * @struct
 * @interface
 */
eth.ProviderError = function () { };

/** @type {string} */
eth.ProviderError.prototype.message;

/** @type {number} */
eth.ProviderError.prototype.code;

/** @type {unknown} */
eth.ProviderError.prototype.data;

/**
 * The container object that is passed to the provider.
 *
 * @interface
 * @struct
 */
eth.Request = function () { }

/** @type {string} */
eth.Request.prototype.method;

/** @type {Array<*>} */
eth.Request.prototype.params;

/**
 * @interface
 * @struct
 */
eth.SwitchChainParam = function () { }

/** @const {string} */
eth.SwitchChainParam.prototype.chainId;

/**
 * @interface
 * @struct
 */
eth.AddChainParam = function () { }

/** @const {string} */
eth.AddChainParam.prototype.chainId;

/** @const {string} */
eth.AddChainParam.prototype.chainName;

/**
 * @const {{
 *   name: string,
 *   symbol: string,
 *   decimals: number
 * }}
 */
eth.AddChainParam.prototype.nativeCurrency;

/** @const {string[]} */
eth.AddChainParam.prototype.rpcUrls;

/** @const {string[]} */
eth.AddChainParam.prototype.blockExplorerUrls;

/**
 * The struct that is passed to the wallet to add an asset.
 * Currently most wallets support only ERC20 assets.
 *
 * @interface
 * @struct
 */
eth.WatchAssetParam = function () { }

/** @type {string} */
eth.WatchAssetParam.prototype.type;

/**
 * @struct
 * @interface
 */
eth.WatchAssetParamOptions = function () { }

/** @type {string} */
eth.WatchAssetParamOptions.prototype.address;

/** @type {string} */
eth.WatchAssetParamOptions.prototype.symbol;

/** @type {number} */
eth.WatchAssetParamOptions.prototype.decimals;

/** @type {string} */
eth.WatchAssetParamOptions.prototype.image;

/** @type {string} */
eth.WatchAssetParamOptions.prototype.tokenId;

/**
 * @struct
 * @interface
 */
eth.ProviderRpcError = function () { };

/** @type {string} */
eth.ProviderRpcError.prototype.message;

/** @type {number} */
eth.ProviderRpcError.prototype.code;

/** @type {unknown} */
eth.ProviderRpcError.prototype.data;

/**
 * @struct
 * @interface
 */
eth.ProviderInfo = function () { };

/** @type {string} */
eth.ProviderInfo.prototype.uuid;

/** @type {string} */
eth.ProviderInfo.prototype.name;

/** @type {string} */
eth.ProviderInfo.prototype.icon;

/** @type {string} */
eth.ProviderInfo.prototype.rdns;

/**
 * @struct
 * @interface
 */
eth.ProviderDetail = function () { };

/** @type {eth.UiProvider} */
eth.ProviderDetail.prototype.provider;

/** @type {eth.ProviderInfo} */
eth.ProviderDetail.prototype.info;

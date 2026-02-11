import { ChainId } from "./chains";
import { Signer } from "./signer";

/**
 * @interface
 * @struct
 * @extends {Signer}
 */
function Provider() { }

/**
 * @return {boolean}
 */
Provider.prototype.isInitialized = function () { }

/**
 * @param {any} nativeProvider
 */
Provider.prototype.setNativeProvider = function (nativeProvider) { }

/**
 * @return {string}
 */
Provider.prototype.downloadURL = function () { }

/**
 * @param {ChainId} chain
 * @param {(chainId: ChainId) => void} chainChanged
 * @param {(addresses: string[]) => void} addressChanged
 * @param {boolean=} onlyIfApproved
 * @return {Promise<void>|void}
 */
Provider.prototype.connect = function (chain, chainChanged, addressChanged, onlyIfApproved) { }

/**
 * Disconnect the provider connection, detaching all listeners.
 */
Provider.prototype.disconnect = function () { }

/**
 * @param {string} chain
 * @return {Promise<void>|void}
 */
Provider.prototype.switchChain = function (chain) { }

/**
 * @param {ChainId} chain
 * @return {boolean}
 */
Provider.prototype.isChainSupported = function (chain) { }

/**
 * @type {any}
 */
Provider.prototype.nativeProvider;

export { Provider };

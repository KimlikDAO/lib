import { ChainId } from "./chains";
import { Signer } from "./signer";

/**
 * @interface
 * @extends {Signer}
 */
class Provider extends Signer {
	/**
	 * @return {boolean}
	 */
	isInitialized() { }

	/**
	 * @param {any} nativeProvider
	 */
	setNativeProvider(nativeProvider) { }

	/**
	 * @return {string}
	 */
	downloadURL() { }

	/**
	 * @param {ChainId} chain
	 * @param {(chainId: ChainId) => void} chainChanged
	 * @param {(addresses: string[]) => void} addressChanged
	 * @param {boolean=} onlyIfApproved
	 * @return {Promise<void>|void}
	 */
	connect(chain, chainChanged, addressChanged, onlyIfApproved) { }

	/**
	 * Disconnect the provider connection, detaching all listeners.
	 */
	disconnect() { }

	/**
	 * @param {string} chain
	 * @return {Promise<void>|void}
	 */
	switchChain(chain) { }

	/**
	 * @param {ChainId} chain
	 * @return {boolean}
	 */
	isChainSupported(chain) { }

	/**
	 * @type {any}
	 */
	nativeProvider;
}

export { Provider };

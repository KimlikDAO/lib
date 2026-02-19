import { EIP1193Provider as EthereumProvider } from "../ethereum/provider.d";
import { Provider as MinaProvider } from "../mina/provider.d";
import { ChainId } from "./chains";
import { Signer } from "./signer";

/** @typedef {MinaProvider | EthereumProvider} */
const Provider = {};

/**
 * @interface
 */
class WalletConnector extends Signer {
	/**
	 * @return {boolean}
	 */
	isInitialized() { }

	/**
	 * @param {Provider} provider
	 */
	setProvider(provider) { }

	/**
	 * @return {string}
	 */
	downloadURL() { }

	/**
	 * @param {ChainId} chain
	 * @param {(chainId: ChainId) => void} chainChanged
	 * @param {(addresses: string[]) => void} addressChanged
	 * @param {boolean=} onlyIfApproved
	 * @return {Promise<void> | void}
	 */
	connect(chain, chainChanged, addressChanged, onlyIfApproved) { }

	/**
	 * Disconnect the provider connection, detaching all listeners.
	 */
	disconnect() { }

	/**
	 * @param {ChainId} chainId
	 * @return {Promise<unknown> | void}
	 */
	switchChain(chainId) { }

	/**
	 * @param {ChainId} chainId
	 * @return {boolean}
	 */
	isChainSupported(chainId) { }
}

export { Provider, WalletConnector };

import jsonrpc from "../api/jsonrpc";
import { ChainId } from "../crosschain/chains";
import abi from "./abi";
import { Address } from "./address.d";
import { Provider } from "./provider";
import { Transaction } from "./transaction.d";

/** @const {string} */
const ContractAddress = "0xcCc0a9b023177549fcf26c947edb5bfD9B230cCc";

/**
 * @param {Provider} provider
 * @param {ChainId} chainId
 * @param {Address} addr
 * @return {Promise<string>}
 */
const handleOf = (provider, chainId, addr) => /** @type {Promise<string>} */(provider.read(
  /** @type {Transaction} */({
    to: ContractAddress,
    data: "0xc50a1514" + abi.address(addr),
    chainId: chainId,
  })
));

/**
 * @param {Provider} provider
 * @param {ChainId} chainId
 * @param {Address} addr
 * @return {Promise<boolean>}
 */
const hasKPass = (provider, chainId, addr) => handleOf(provider, chainId, addr)
  .then(abi.isNonzero);

/**
 * TODO(KimlikDAO-bot): Remove dependency on jsonrpc by having a JsonRpcProvider
 * which handles fetches.
 *
 * @param {Record<ChainId, string>} providerURLs
 * @param {Address[]} addresses
 * @return {Promise<boolean[]>}
 */
const hasKPasses = (providerURLs, addresses) => {
  /** @const {ChainId[]} */
  const chains = Object.keys(providerURLs);

  /** @const {Promise<boolean[][]>} */
  const tableByChainPromise = Promise.all(chains.map((chainId) => jsonrpc.callMulti(
    "https://" + providerURLs[chainId], "eth_call",
    addresses.map((addr) => [
      /** @type {Transaction} */({
        to: ContractAddress,
        data: "0xc50a1514" + abi.address(addr)
      }), "latest"
    ])
  ).then((/** @type {string[]} */ handles) => handles.map(abi.isNonzero))
  ));

  return tableByChainPromise.then(
    (/** @type {boolean[][]} */ tableByChain) => tableByChain
      .reduce(
      /** @type {(arr: boolean[]) => boolean[]} */(
        (/** @type {boolean[]} */ acc, /** @type {boolean[]} */ row) =>
          row.map((item, index) => acc[index] || item)),
          /** @type {boolean[]} */(new Array(addresses.length).fill(false))
    ));
}

export default {
  ContractAddress,
  handleOf,
  hasKPass,
  hasKPasses,
};

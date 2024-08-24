import jsonrpc from "../api/jsonrpc";
import { ChainId } from "../crosschain/chains";
import { address, callMethod, isNonzero } from "./provider";
import "./transaction.d";

/** @const {!Array<string>} */
const KPASS_ADDRS = [
  "0xcCc0a9b023177549fcf26c947edb5bfD9B230cCc", // All EVM chains except zkSync Era.
  "0xcCc053d81e3B85Eac133a5333be4D7cBDd120cCc", // zkSync Era
];

/**
 * @param {ChainId} chainId
 * @return {string} KPass contract address
 */
const getAddress = (chainId) => KPASS_ADDRS[+(chainId == ChainId.x144)];

/**
 * @param {!eth.Provider} provider
 * @param {ChainId} chainId
 * @param {string} addr
 * @return {!Promise<string>}
 */
const handleOf = (provider, chainId, addr) => chainId.startsWith("mi")
  ? fetch("//demo-mapping.kimlikdao.org/" + addr).then((res) => res.text())
  : callMethod(provider, getAddress(chainId), "0xc50a1514" + address(addr));

/**
 * @param {!eth.Provider} provider
 * @param {ChainId} chainId
 * @param {string} addr
 * @return {!Promise<boolean>}
 */
const hasKPass = (provider, chainId, addr) => handleOf(provider, chainId, addr).then(isNonzero);

/**
 * TODO(KimlikDAO-bot): Remove dependency on jsonrpc by having a JsonRpcProvider
 * which handles fetches.
 *
 * @param {!Object<ChainId, string>} providerURLs
 * @param {!Array<string>} addresses
 * @return {!Promise<!Array<boolean>>}
 */
const hasKPasses = (providerURLs, addresses) => {
  /** @const {!Array<ChainId>} */
  const chains = Object.keys(providerURLs);

  /** @const {!Promise<!Array<!Array<boolean>>>} */
  const tableByChainPromise = Promise.all(chains.map((chainId) => jsonrpc.callMulti(
    "https://" + providerURLs[chainId], "eth_call",
    addresses.map((addr) => [
      /** @type {!eth.Transaction} */({
        to: getAddress(chainId),
        data: "0xc50a1514" + address(addr)
      }), "latest"
    ])
  ).then((/** @type {!Array<string>} */ handles) => handles.map(isNonzero))
  ));

  return tableByChainPromise.then((/** !Array<!Array<boolean>> */ tableByChain) =>
    tableByChain.reduce(
      /** @type {function(!Array<boolean>):!Array<boolean>} */(
        (/** !Array<boolean> */ acc, /** !Array<boolean> */ row) => row.map((item, index) => acc[index] || item)),
      /** @type {!Array<boolean>} */(new Array(addresses.length).fill(false))
    ));
}

export default {
  KPASS_ADDRS,
  getAddress,
  handleOf,
  hasKPass,
  hasKPasses,
};

import jsonrpc from "../../../api/jsonrpc";
import evm from "../../../ethereum/evm";

/** @const {!Object<string, string>} */
const Chains = {
  "0x1": "cloudflare-eth.com",
  "0xa86a": "api.avax.network/ext/bc/C/rpc",
  "0x89": "polygon-rpc.com",
  "0xa4b1": "arb1.arbitrum.io/rpc",
  "0x38": "bsc-dataseed3.binance.org",
  "0xfa": "rpc.ankr.com/fantom",
};

/**
 * @const {string}
 * @noinline
 */
const KPASS = "0xcCc0a9b023177549fcf26c947edb5bfD9B230cCc";

/**
 * @param {!Array<string>} addresses
 * @return {!Promise<!Array<boolean>>}
 */
const hasKPass = (addresses) => {
  /** @const {!Array<string>} */
  const chains = Object.keys(Chains);
  /** @const {!Array<!Array<!eth.Transaction|string>>} */
  const paramsList = addresses.map((addr) => [
    /** @type {!eth.Transaction} */({
      to: KPASS,
      data: "0xc50a1514" + evm.address(addr)
    }), "latest"
  ]);
  /** @const {!Promise<!Array<!Array<boolean>>>} */
  const tableByChainPromise = Promise.all(chains.map((chainID) => jsonrpc.callMulti(
    "https://" + Chains[chainID], "eth_call",
    paramsList
  ).then(
    (/** @type {!Array<string>} */ handles) =>
      handles.map((handle) => !evm.isZero(handle))
  )));

  return tableByChainPromise.then((tableByChain) =>
    tableByChain.reduce(
      (acc, row) => row.map((item, index) => acc[index] || item),
      new Array(addresses.length).fill(false)
    )
  );
}

export { hasKPass };

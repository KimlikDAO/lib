import { Request } from "./provider.d";

/**
 * @param {Provider} provider
 * @param {string} txHash
 * @param {() => void} then
 */
const whenMined = (provider, txHash, then) => {
  const interval = setInterval(() =>
    provider.request(/** @type {eth.Request} */({
      method: "eth_getTransactionReceipt",
      params: [txHash]
    }))
      .then((receipt) => {
        if (receipt) {
          clearInterval(interval);
          then();
        }
      }),
    1000);
}

export { whenMined };

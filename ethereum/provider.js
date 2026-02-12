import "./provider.d";

/**
 * @param {eth.Provider} provider
 * @param {string} contract Contract adddress given with the 0x prefix
 * @param {string} calldata Calldata transmitted to the contract verbatim.
 * @param {string=} from
 * @return {Promise<string>}
 */
const callMethod = (provider, contract, calldata, from) =>
  provider.request(/** @type {eth.Request} */({
    method: "eth_call",
    params: [/** @type {eth.Transaction} */({
      to: contract,
      data: calldata,
      from
    }), "latest"]
  }));

/**
 * @param {string} address starting with 0x
 * @return {string} length 64 string, padded for calldata
 */
const address = (address) => "0".repeat(24) + address.slice(2);

/**
 * @param {string} value
 * @return {boolean}
 */
const isNonzero = (value) => value.replaceAll("0", "") != 'x';

export {
  address,
  callMethod,
  isNonzero,
};

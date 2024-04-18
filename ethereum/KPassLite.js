import { ChainId } from "../crosschain/chains";
import { address, callMethod, isNonzero } from "./provider";

/** @const {!Array<string>} */
const KPASS_ADDRS = [
  "0xcCc0a9b023177549fcf26c947edb5bfD9B230cCc", // All EVM chains except zkSync Era.
  "0xcCc053d81e3B85Eac133a5333be4D7cBDd120cCc", // zkSync Era
];

/**
 * @param {ChainId} chainId
 * @return {string} KPASS contract address
 */
const getAddress = (chainId) => KPASS_ADDRS[+(chainId == ChainId.x144)];

/**
 * @param {!eth.Provider} provider
 * @param {ChainId} chainId
 * @param {string} addr
 * @return {!Promise<string>}
 */
const handleOf = (provider, chainId, addr) => chainId.startsWith("m:")
  ? fetch("//demo-mapping.kimlikdao.org/" + addr).then((res) => res.text())
  : callMethod(provider, getAddress(chainId), "0xc50a1514" + address(addr));

/**
 * @param {!eth.Provider} provider
 * @param {ChainId} chainId
 * @param {string} addr
 * @return {!Promise<boolean>}
 */
const hasKPass = (provider, chainId, addr) => handleOf(provider, chainId, addr).then(isNonzero);

export default {
  getAddress,
  handleOf,
  hasKPass,
};

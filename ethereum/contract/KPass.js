import abi from "../abi";
import { ChainId } from "../chains";
import { Provider as IProvider, RemoteProvider } from "../provider";
import { Tokens } from "./tokens";

/** @const {string} */
const KPASS = "0xcCc0a9b023177549fcf26c947edb5bfD9B230cCc";
/** @const {number} */
const MILLION = 1_000_000;
/** @const {bigint} */
const TRILLION = 10n ** 12n;
/** @type {IProvider} */
let Provider = new RemoteProvider(() => Promise.resolve(""));

/**
 * @param {IProvider} provider
 */
const setProvider = (provider) => Provider = provider;

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @return {Promise<string>}
 */
const handleOf = (chainId, address) => Provider.read({
  to: KPASS,
  data: "0xc50a1514" + abi.address(address),
  chainId: chainId,
});

/**
 * @param {ChainId} chainId
 * @param {string} sender
 * @return {Promise<number>}
 */
const revokesRemaining = (chainId, sender) => Provider
  .read({
    to: KPASS,
    data: "0x165c44f3" + abi.address(sender),
    chainId,
  })
  .then((revokes) => parseInt(revokes.slice(-6), 16));

/**
 * @param {ChainId} chainId
 * @param {number} gasLimit
 * @return {number | undefined}
 */
const maybeGasLimit = (chainId, gasLimit) => chainId == ChainId.xa4b1 
  ? undefined
  : gasLimit;

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @param {number} deltaWeight
 * @return {Promise<unknown>}
 */
const reduceRevokeThreshold = (chainId, address, deltaWeight) =>
  Provider.write({
    to: KPASS,
    from: address,
    gas: maybeGasLimit(chainId, 22_000),
    data: "0xab505b1c" + abi.uint256(deltaWeight),
    chainId,
  });

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @param {number} deltaWeight revoker weight.
 * @param {string} revokerAddress revoker address.
 * @return {Promise<unknown>}
 */
const addRevoker = (chainId, address, deltaWeight, revokerAddress) =>
  Provider.write({
    to: KPASS,
    from: address,
    gas: maybeGasLimit(chainId, 49_000),
    data: "0xf02b3297" + abi.uint96(deltaWeight) + abi.packedAddress(revokerAddress),
    chainId,
  });

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @return {Promise<unknown>}
 */
const revoke = (chainId, address) =>
  Provider.write({
    to: KPASS,
    from: address,
    gas: maybeGasLimit(chainId, 53_000),
    data: "0xb6549f75",
    chainId,
  });

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @param {string} friend
 * @return {Promise<unknown>}
 */
const revokeFriend = (chainId, address, friend) =>
  Provider.write({
    to: KPASS,
    from: address,
    gas: maybeGasLimit(chainId, 80_000),
    data: "0x3a2c82c7" + abi.address(friend),
    chainId,
  });

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @param {string} cid
 * @param {number} revokeThreshold
 * @param {Record<string, number>} revokers
 * @return {Promise<unknown>}
 */
const createWithRevokers = (chainId, address, cid, revokeThreshold, revokers) =>
  priceIn(chainId, 0).then(([high, low]) => {
    /** @const {bigint} */
    const price = TRILLION * BigInt(revokeThreshold == 0 ? high : low);
    const data = revokeThreshold == 0
      ? "0x780900dc" + cid
      : "0xd3cfebc1" + cid + serializeRevokers(revokeThreshold, revokers);
    const gas = revokeThreshold == 0
      ? maybeGasLimit(chainId, 49_000)
      : maybeGasLimit(chainId, 70_000 + 25_000 * Object.keys(revokers).length);
    return Provider.write({
      to: KPASS,
      from: address,
      value: price,
      gas,
      data,
      chainId,
    });
  });

/**
 * @param {number} revokeThreshold The threshold for vote weight after which
 *                                 the KPass is revoked.
 * @param {Record<string, number>} revokers (Address, weight) pairs for the
 *                                           revokers.
 * @return {string} serialized revoker list.
 */
const serializeRevokers = (revokeThreshold, revokers) => {
  /** @type {string} */
  let ser = "";
  /** @type {number} */
  let count = 0;
  for (let address in revokers) {
    if (address == "length") continue;
    count += 1;
    ser += abi.uint96(revokers[address]) + address.slice(2).toLowerCase();
  }
  ser += abi.uint256(0).repeat(5 - count);
  return abi.uint64(revokeThreshold) + ser.slice(16);
}

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @param {string} cid
 * @param {number} revokeThreshold
 * @param {Record<string, number>} revokers
 * @param {string} signature as a length 64 hex string.
 * @return {Promise<unknown>}
 */
const createWithRevokersWithTokenPermit = (chainId, address, cid, revokeThreshold, revokers, signature) => {
  const data = revokeThreshold == 0
    ? "0xe0adf95b" + cid + signature
    : "0x0633ddcb" + cid + serializeRevokers(revokeThreshold, revokers) + signature;
  const gas = revokeThreshold == 0
    ? maybeGasLimit(chainId, 160_000)
    : maybeGasLimit(chainId, 180_000 + 25_000 * Object.keys(revokers).length);
  return Provider.write({
    to: KPASS,
    from: address,
    value: 0,
    gas,
    data,
    chainId,
  });
}

/**
 * @param {ChainId} chainId
 * @param {string} address
 * @param {string} cid
 * @param {number} revokeThreshold
 * @param {Record<string, number>} revokers
 * @param {number} token
 * @return {Promise<unknown>}
 */
const createWithRevokersWithTokenPayment = (chainId, address, cid, revokeThreshold, revokers, token) => {
  /** @const {string} */
  const tokenSerialized = abi.uint96(0) + abi.packedAddress(Tokens[chainId][token].contract);
  const data = revokeThreshold == 0
    ? "0xdaca45f7" + cid + tokenSerialized
    : "0x3e36b2f7" + cid + serializeRevokers(revokeThreshold, revokers) + tokenSerialized;
  const gas = revokeThreshold == 0
    ? maybeGasLimit(chainId, 140_000)
    : maybeGasLimit(chainId, 160_000 + 25_000 * Object.keys(revokers).length);
  return Provider.write({
    to: KPASS,
    from: address,
    value: 0,
    gas,
    data,
    chainId,
  });
}

/**
 * @param {ChainId} chainId
 * @param {number} token
 * @return {Promise<number[]>} price of KPass in the given currency
 */
const priceIn = (chainId, token) => {
  if (chainId == "0x38" && token == 0)
    return Promise.resolve([5000, 3400]);
  const price = {
    "0x1": [600, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
    "0xa86a": [50_000, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
    "0x89": [800_000, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
    "0xa4b1": [600, 1 * MILLION, 1 * MILLION, 19 * MILLION, 0],
    "0x38": [3400, 1 * MILLION, 1 * MILLION, 19 * MILLION, 1 * MILLION],
    "0xfa": [2_300_000, 1 * MILLION, 1 * MILLION, 19 * MILLION, 0],
    "0x144": [600, 1 * MILLION, 1 * MILLION, 19 * MILLION, 0],
  }
  return Promise.resolve([
    price[chainId][token] * 1.5, price[chainId][token]
  ]);
}

/**
 * @param {ChainId} chainId
 * @return {Promise<number>}
 */
const estimateNetworkFee = (chainId) => {
  const placeholder = {
    "0x1": 600,
    "0xa86a": 800,
    "0x89": 400,
    "0xa4b1": 200,
    "0x38": 400,
  }
  return Promise.resolve(placeholder[chainId]);
}

export default {
  addRevoker,
  createWithRevokers,
  createWithRevokersWithTokenPayment,
  createWithRevokersWithTokenPermit,
  estimateNetworkFee,
  handleOf,
  priceIn,
  reduceRevokeThreshold,
  revoke,
  revokeFriend,
  revokesRemaining,
  setProvider,
};

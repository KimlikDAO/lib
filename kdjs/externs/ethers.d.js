/**
 * @externs
 *
 * @author KimlikDAO
 */

/** @const */
const ethers = {};

/**
 * @typedef {{
 *   name: string,
 *   version: string,
 *   chainId: (bigint|string),
 *   verifyingContract: string
 * }}
 */
ethers.TypedDataDomain;

ethers.TypedDataEncoder;

/**
 * @param {!ethers.TypedDataDomain} typedDataDomain
 * @return {string}
 */
ethers.TypedDataEncoder.hashDomain = function (typedDataDomain) { }

/**
 * @constructor
 * @param {string} privateKey
 * @struct
 */
const Wallet = function (privateKey) { }

/**
 * @const {string}
 */
Wallet.prototype.address;

/**
 * @param {string} message
 * @return {!Promise<string>}
 */
Wallet.prototype.signMessage = function (message) { }

export { Wallet };

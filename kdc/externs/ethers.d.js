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
 *   chainId: (!bigint|string),
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

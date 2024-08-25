/**
 * @externs
 */

/** @const */
const eth = {};

/**
 * A string of length 132, starting with 0x.
 *
 * @typedef {string}
 */
eth.WideSignature;

/**
 * A string of length 128 denoting a comapct signature where s and yParity are
 * packed into a single uint128.
 * @see {@link evm.signCompact}
 * @see {@link evm.compactSignature}
 * @see https://eips.ethereum.org/EIPS/eip-2098
 *
 * @typedef {string}
 */
eth.CompactSignature;

export default eth;

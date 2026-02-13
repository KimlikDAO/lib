/**
 * A string of length 42, starting with 0x.
 */
type Address = string;

/**
 * A length 40 hex string denoting and address without the leading 0x.
 */
type PackedAddress = string;

/**
 * A string of length 132, starting with 0x.
 */
type WideSignature = string;

/**
 * A string of length 128 denoting a compact signature where s and yParity are
 * packed into a single uint128.
 * @see {@link evm.signCompact}
 * @see {@link evm.compactSignature}
 * @see https://eips.ethereum.org/EIPS/eip-2098
 */
type CompactSignature = string;

export {
  Address,
  PackedAddress,
  WideSignature,
  CompactSignature
};

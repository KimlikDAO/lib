/**
 * Represents an Ethereum address as a length-42 string beginning with "0x".
 * The address may use mixed-case checksum encoding as defined by
 * [EIP-55](https://eips.ethereum.org/EIPS/eip-55), or be all lowercase or
 * uppercase.
 */
type Address = string;

/**
 * A length 40 hexadecimal string representing an address without the leading
 * "0x". Must be lowercase with no checksum applied.
 */
type PackedAddress = string;

export {
  Address,
  PackedAddress,
};

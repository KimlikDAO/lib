/**
 * A string of length 42, starting with 0x, which may be checksummed.
 */
type Address = string;

/**
 * A length 40 hexadecimal string representing an address without the leading "0x".
 * Must be lowercase with no checksum applied.
 */
type PackedAddress = string;

export {
  Address,
  PackedAddress,
};

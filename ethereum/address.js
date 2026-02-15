import { keccak256 } from "../crypto/sha3";
import { Address, PackedAddress } from "./address.d";

/**
 * Implements EIP-55 address checksum encoding, for UI validation.
 * Single-case inputs are converted to checksummed addresses.
 * For mixed-case inputs, returns null if the address is invalid, returns
 * the original address if valid.
 *
 * @param {Address} address The Ethereum address (with 0x prefix)
 * @return {Address | null} Checksummed address or null if invalid
 */
const validate = (address) => {
  if (address.length != 42 || !address.startsWith("0x")) return null;
  /** @const {string} */
  const entropy = keccak256(address.slice(2).toLowerCase());
  /** @type {boolean} */
  let hasUpper = false;
  /** @type {boolean} */
  let hasLower = false;
  /** @type {boolean} */
  let hasDiff = false;
  /** @type {Uint8Array} */
  let checksum = new Uint8Array(42);
  checksum[0] = 48;  // '0'
  checksum[1] = 120; // 'x'
  for (let /** @type {number} */ i = 2; i < address.length; ++i) {
    let c = address.charCodeAt(i);
    let e = entropy.charCodeAt(i - 2);
    if (65 <= c && c <= 90) { // uppercase A-Z
      hasUpper = true;
      checksum[i] = (e > 55) ? c : c + 32;
      hasDiff ||= !(e > 55);
    } else if (97 <= c && c <= 122) { // lowercase a-z
      hasLower = true;
      checksum[i] = (e > 55) ? c - 32 : c;
      hasDiff ||= (e > 55);
    } else if (48 <= c && c <= 57) { // numbers 0-9
      checksum[i] = c;
    } else return null;
  }
  if (hasLower && hasUpper && hasDiff)
    return null;
  return new TextDecoder().decode(checksum);
}

/**
 * Tests if a given string is a valid EVM address with correct checksum.
 *
 * @param {Address} address
 * @return {boolean} whether the address is valid
 */
const isValid = (address) => {
  if (address.length != 42 || !address.startsWith("0x")) return false;
  address = address.slice(2);
  /** @const {string} */
  const entropy = keccak256(address.toLowerCase());

  for (let /** number */ i = 0; i < address.length; ++i) {
    let c = address.charCodeAt(i);
    let e = entropy.charCodeAt(i);
    if (65 <= c && c <= 90) {  // uppercase A-Z
      if (e <= 55) return false;
    } else if (97 <= c && c <= 122) { // lowercase a-z
      if (e > 55) return false;
    } else if (c < 48 || 57 < c)
      return false;
  }
  return true;
}

/**
 * @param {Address} address 
 * @return {PackedAddress}
 */
const pack = (address) => address.slice(2).toLowerCase();

export default {
  validate,
  isValid,
  pack,
};

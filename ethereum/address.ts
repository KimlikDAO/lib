import { keccak256Uint32, keccak256Uint32ToHex } from "../crypto/sha3";
import { PureExpr } from "../kdts/kdts.d";
import bigints from "../util/bigints";
import { Address } from "./address.d";

const Encoder = new TextEncoder() satisfies PureExpr;
const Decoder = new TextDecoder() satisfies PureExpr;

/**
 * Returns the ethereum address for a given public key in the (x, y) format.
 * The returned address is not checksummed. Use {@link validate()} to apply
 * the checksum if needed.
 * @pure
 */
const fromPoint = ({ x, y }: { x: bigint, y: bigint }): Address => {
  const bytes = new Uint8Array(64);
  bigints.intoBytesBE(bytes, x, 32);
  bigints.intoBytesBE(bytes, y, 64);
  const hash = new Uint8Array(
    keccak256Uint32(new Uint32Array(bytes.buffer)).buffer, 12, 20);
  return "0x" + hash.toHex();
}

/** @pure */
const hashAddr = (addr: Address): string => {
  const bytes = Encoder.encode(addr.slice(2).toLowerCase());
  return keccak256Uint32ToHex(new Uint32Array(bytes.buffer));
}

/**
 * Validates an Ethereum address according to EIP-55 checksum encoding.
 * For single-case (all upper or all lower case) input, returns the formatted
 * checksummed address. For mixed-case input, returns the address if the
 * checksum is valid; null otherwise. Returns null for malformed inputs, such
 * as wrong length, missing '0x' prefix, or invalid characters.
 * @pure
 */
const validate = (addr: Address): Address | null => {
  if (addr.length != 42 || !addr.startsWith("0x")) return null;
  const hashed = hashAddr(addr);
  let hasUpper = false;
  let hasLower = false;
  let hasDiff = false;
  let checksum = new Uint8Array(42);
  checksum[0] = 48;  // '0'
  checksum[1] = 120; // 'x'
  for (let i = 2; i < addr.length; ++i) {
    let c = addr.charCodeAt(i);
    let e = hashed.charCodeAt(i - 2);
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
  return Decoder.decode(checksum);
}

/**
 * Tests if a given string is a valid EVM address with correct checksum.
 * @pure
 */
const isValid = (addr: Address): boolean => {
  if (addr.length != 42 || !addr.startsWith("0x")) return false;
  const hashed = hashAddr(addr);
  for (let i = 2; i < addr.length; ++i) {
    let c = addr.charCodeAt(i);
    let e = hashed.charCodeAt(i - 2);
    if (65 <= c && c <= 90) {  // uppercase A-Z
      if (e <= 55) return false;
    } else if (97 <= c && c <= 122) { // lowercase a-z
      if (e > 55) return false;
    } else if (c < 48 || 57 < c)
      return false;
  }
  return true;
}

export default {
  fromPoint,
  validate,
  isValid,
};

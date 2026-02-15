import abi from "./abi";
import { Signature, WideSignature } from "./signature.d";

/**
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * Converts a wide signature to a EIP2098 signature.
 *
 * @param {WideSignature} sig 
 * @return {Signature}
 */
const fromWide = (sig) => {
  /** @const {boolean} */
  const yParity = sig.slice(-2) == "1c";
  sig = sig.slice(2, -2);
  if (yParity) {
    /** @const {string} */
    const t = (parseInt(sig[64], 16) + 8).toString(16);
    sig = sig.slice(0, 64) + t + sig.slice(65, 128);
  }
  return sig;
}

/**
 * @param {{
 *   r: bigint,
 *   s: bigint,
 *   yParity: boolean
 * }} sig
 * @return {Signature}
 */
const fromUnpacked = ({ r, s, yParity }) =>
  abi.uint256(r) + abi.uint256(yParity ? s + (1n << 255n) : s);

/**
 * @param {{
 *   r: bigint,
 *   s: bigint,
 *   yParity: boolean
 * }} sig
 * @return {WideSignature}
 */
const toWideFromUnpacked = ({ r, s, yParity }) =>
  "0x" + abi.uint256(r) + abi.uint256(s) + (27 + +yParity).toString(16);

/**
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * Converts a compact EIP2098 signature to wide format.
 *
 * @param {Signature} sig
 * @return {WideSignature}
 */
const toWide = (sig) => {
  /** @const {number} */
  const highNibble = parseInt(sig[64], 16);
  /** @const {boolean} */
  const yParity = highNibble >= 8;
  /** @const {string} */
  const s = yParity
    ? (highNibble - 8).toString(16) + sig.slice(65)
    : sig.slice(64);
  return "0x" + sig.slice(0, 64) + s + (yParity ? "1c" : "1b");
};

export default {
  fromWide,
  fromUnpacked,
  toWide,
  toWideFromUnpacked,
};

import abi from "./abi";
import { Signature, WideSignature } from "./signature.d";

type UnpackedSignature = {
  r: bigint;
  s: bigint;
  yParity: boolean
};

/**
 * Converts a wide signature to a EIP2098 signature.
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * @satisfies {PureFn}
 */
const fromWide = (sig: WideSignature): Signature => {
  const yParity = sig.slice(-2) == "1c";
  let s = sig.slice(2, -2);
  if (yParity) {
    const t = (parseInt(s[64], 16) + 8).toString(16);
    s = s.slice(0, 64) + t + s.slice(65, 128);
  }
  return s;
};

/** @satisfies {PureFn} */
const fromUnpacked = (sig: UnpackedSignature): Signature =>
  abi.uint256(sig.r) + abi.uint256(sig.yParity ? sig.s + (1n << 255n) : sig.s);

/** @satisfies {PureFn} */
const toWideFromUnpacked = (sig: UnpackedSignature): WideSignature =>
  `0x${abi.uint256(sig.r) + abi.uint256(sig.s) + (27 + +sig.yParity).toString(16)}`;

/**
 * Converts a compact EIP2098 signature to wide format.
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * @satisfies {PureFn}
 */
const toWide = (sig: Signature): WideSignature => {
  const highNibble = parseInt(sig[64], 16);
  const yParity = highNibble >= 8;
  const s = yParity
    ? (highNibble - 8).toString(16) + sig.slice(65)
    : sig.slice(64);
  return `0x${sig.slice(0, 64) + s + (yParity ? "1c" : "1b")}`;
};

export { UnpackedSignature };

export default {
  fromWide,
  fromUnpacked,
  toWide,
  toWideFromUnpacked,
};

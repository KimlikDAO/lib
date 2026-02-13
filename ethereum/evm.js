/**
 * @fileoverview EVM ile ilgili yardımcı fonksiyonlar.
 *
 * @author KimlikDAO
 */
import { keccak256, keccak256Uint8 } from '../crypto/sha3';
import hex from "../util/hex";
import {
  Address,
  CompactSignature,
  PackedAddress,
  WideSignature
} from "./ethereum.d";

/**
 * Implements EIP-55 address checksum encoding, for UI validation.
 * Single-case inputs are converted to checksummed addresses.
 * For mixed-case inputs, returns null if the address is invalid, returns
 * the original address if valid.
 *
 * @param {Address} address The Ethereum address (with 0x prefix)
 * @return {Address | null} Checksummed address or null if invalid
 */
const correctAddress = (address) => {
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
  for (let /** number */ i = 2; i < address.length; ++i) {
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
const isAddressValid = (address) => {
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
 * @see https://eips.ethereum.org/EIPS/eip-2098
 *
 * @param {WideSignature} signature of length 2 + 64 + 64 + 2 = 132
 * @return {CompactSignature} compactSignature as a string of length 128 (64 bytes).
 */
const compactSignature = (signature) => {
  /** @const {boolean} */
  const yParity = signature.slice(-2) == "1c";
  signature = signature.slice(2, -2);
  if (yParity) {
    /** @const {string} */
    const t = (parseInt(signature[64], 16) + 8).toString(16);
    signature = signature.slice(0, 64) + t + signature.slice(65, 128);
  }
  return signature;
}

/**
 * @param {string} msg
 * @return {string} hex encoded hash
 */
const personalDigest = (msg) => {
  /** @const {TextEncoder} */
  const encoder = new TextEncoder();
  /** @const {Uint8Array} */
  const msgEncoded = encoder.encode(msg);
  /** @const {Uint8Array} */
  const lenEncoded = encoder.encode("" + msgEncoded.length);
  /** @const {Uint8Array} */
  const encoded = new Uint8Array(26 + lenEncoded.length + msgEncoded.length);
  encoder.encodeInto("\x19Ethereum Signed Message:\n", encoded);
  encoded.set(lenEncoded, 26);
  encoded.set(msgEncoded, 26 + lenEncoded.length);
  return hex.from(keccak256Uint8(encoded));
}

/**
 * @param {Address} addr EVM adresi; 0x ile başlamalı.
 * @return {PackedAddress} 40 uzunluğunde hex kodlanmış adres
 */
const packedAddress = (addr) => addr.slice(2).toLowerCase();

/**
 * @param {Address} addr EVM adresi; 0x ile başlamalı.
 * @return {string} calldata için hazırlanmış adres.
 */
const address = (addr) => "0".repeat(24) + packedAddress(addr)

/**
 * @param {number | bigint} num
 * @return {string}
 */
const uint256 = (num) => num.toString(16).padStart(64, "0");

/** @const {(num: number) => string} */
const uint160 = (num) => num.toString(16).padStart(40, "0");

/** @const {(num: number) => string} */
const uint96 = (num) => num.toString(16).padStart(24, "0");

/** @const {(num: number) => string} */
const uint64 = (num) => num.toString(16).padStart(16, "0");

/**
 * @param {string} value
 * @return {boolean}
 */
const isZero = (value) => value == "0x" || value.replaceAll("0", "") == 'x';

/**
 * We need the pureOrBreakMyCode annotation since repeat is not inferred
 * to be pure due to polyfills.
 * @see https://github.com/google/closure-compiler/issues/4018
 * @const {string}
 */
const Uint256Max = "f".repeat(64);

export default {
  address,
  correctAddress,
  isAddressValid,
  compactSignature,
  isZero,
  packedAddress,
  personalDigest,
  uint160,
  uint256,
  Uint256Max,
  uint64,
  uint96,
}

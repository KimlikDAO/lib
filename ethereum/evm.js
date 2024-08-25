/**
 * @fileoverview EVM ile ilgili yardımcı fonksiyonlar.
 *
 * @author KimlikDAO
 */
import { keccak256, keccak256Uint8 } from '../crypto/sha3';
import { hex } from "../util/çevir";
import eth from "./eth.d";

/**
 * Verilen bir adresin checksum'ı yoksa ekler, varsa sağlamasını yapar.
 * Sadece arabirimde kullanıcı girdisini düzeltmek üzere kullanılmalı.
 *
 * @param {string} adres
 * @return {?string} Düzeltilmiş adres veya sağlama hatası varsa `null`.
 */
const adresDüzelt = (adres) => {
  if (adres.length != 42 || !adres.startsWith("0x")) return null;
  /** @const {string} */
  const entropi = keccak256(adres.slice(2).toLowerCase());
  /** @type {boolean} */
  let büyükVar = false;
  /** @type {boolean} */
  let küçükVar = false;
  /** @type {boolean} */
  let farkVar = false;
  /** @type {Uint8Array} */
  let sağlama = new Uint8Array(42);

  sağlama[0] = 48;
  sağlama[1] = 120;
  for (let /** number */ i = 2; i < adres.length; ++i) {
    let c = adres.charCodeAt(i);
    let e = entropi.charCodeAt(i - 2);
    if (65 <= c && c <= 90) {
      büyükVar = true;
      sağlama[i] = (e > 55) ? c : c + 32;
      farkVar ||= !(e > 55);
    } else if (97 <= c && c <= 122) {
      küçükVar = true;
      sağlama[i] = (e > 55) ? c - 32 : c;
      farkVar ||= (e > 55);
    } else if (48 <= c && c <= 57) {
      sağlama[i] = c;
    } else return null;
  }

  if (küçükVar && büyükVar && farkVar) {
    return null;
  }
  return new TextDecoder().decode(sağlama);
}

/**
 * Verilen bir dizinin cheksumı doğru bir EVM adresi olup olmadığını test eder.
 *
 * @param {string} adres
 * @return {boolean} adresin geçerli olup olmadığı
 */
const adresGeçerli = (adres) => {
  if (adres.length != 42 || !adres.startsWith("0x")) return false;
  adres = adres.slice(2);
  /** @const {string} */
  const entropi = keccak256(adres.toLowerCase());

  for (let /** number */ i = 0; i < adres.length; ++i) {
    let c = adres.charCodeAt(i);
    let e = entropi.charCodeAt(i);
    if (65 <= c && c <= 90) {
      if (e <= 55) return false;
    } else if (97 <= c && c <= 122) {
      if (e > 55) return false;
    } else if (c < 48 || 57 < c) {
      return false;
    }
  }
  return true;
}

/**
 * @see https://eips.ethereum.org/EIPS/eip-2098
 *
 * @param {eth.WideSignature} signature of length 2 + 64 + 64 + 2 = 132
 * @return {eth.CompactSignature} compactSignature as a string of length 128 (64 bytes).
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
  /** @const {!TextEncoder} */
  const encoder = new TextEncoder();
  /** @const {!Uint8Array} */
  const msgEncoded = encoder.encode(msg);
  /** @const {!Uint8Array} */
  const lenEncoded = encoder.encode("" + msgEncoded.length);
  /** @const {!Uint8Array} */
  const encoded = new Uint8Array(26 + lenEncoded.length + msgEncoded.length);
  encoder.encodeInto("\x19Ethereum Signed Message:\n", encoded);
  encoded.set(lenEncoded, 26);
  encoded.set(msgEncoded, 26 + lenEncoded.length);
  return hex(keccak256Uint8(encoded));
}

/**
 * @param {string} addr EVM adresi; 0x ile başlamalı.
 * @return {eth.PackedAddress} 80 uzunluğunde hex kodlanmış adres
 */
const packedAddress = (addr) => addr.slice(2).toLowerCase();

/**
 * @param {string} addr EVM adresi; 0x ile başlamalı.
 * @return {string} calldata için hazırlanmış adres.
 */
const address = (addr) => "0".repeat(24) + packedAddress(addr)

/**
 * @param {number|bigint} sayı
 * @return {string}
 */
const uint256 = (sayı) => sayı.toString(16).padStart(64, "0");

/** @type {function(number):string} */
const uint160 = (sayı) => sayı.toString(16).padStart(40, "0");

/** @type {function(number):string} */
const uint96 = (sayı) => sayı.toString(16).padStart(24, "0");

/** @type {function(number):string} */
const uint64 = (sayı) => sayı.toString(16).padStart(16, "0");

/**
 * @param {string} value
 * @return {boolean}
 */
const isZero = (value) => value == "0x" || value.replaceAll("0", "") == 'x';

/**
 * @see https://github.com/google/closure-compiler/issues/4018
 *
 * @const {string}
 */
const Uint256Max = "".padEnd(64, "f");

export default {
  address,
  adresDüzelt,
  adresGeçerli,
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

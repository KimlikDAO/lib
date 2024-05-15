import { assertEq } from "../../testing/assert";
import ipfs from "../ipfs";

/**
 * @return {!Promise<*>}
 */
const testCID = () => {
  /** @const {!TextEncoder} */
  const encoder = new TextEncoder();

  return Promise.all([
    ipfs.hash(encoder.encode("a".repeat(2680)))
      .then((/** @type {!Uint8Array} */ hash) =>
        assertEq(ipfs.CID(hash), "Qmawd3DRAY5YwtCzQe8gBumMXA1JCrzvbH2WQR6ZTykVoG")),
    ipfs.hash(encoder.encode("KimlikDAO\n"))
      .then((/** @type {!Uint8Array} */ hash) =>
        assertEq(ipfs.CID(hash), "QmafCiqeYQtiXokAEUB4ToMcZJREhJcShbzvjrYmC1WCsi")),
    ipfs.hash(encoder.encode("foo\n"))
      .then((/** @type {!Uint8Array} */ hash) =>
        assertEq(ipfs.CID(hash), "QmYNmQKp6SuaVrpgWRsPTgCQCnpxUYGq76YEKBXuj2N4H6")),
    ipfs.hash(encoder.encode("a".repeat(31337)))
      .then((/** @type {!Uint8Array} */ hash) =>
        assertEq(ipfs.CID(hash), "Qmbq6rxwg5uKYAEhdFvPnBqzbJWAPfhB4LwF4yGamvzWSR")),
  ]);
}

/** @const {string} */
const IPFS_URL = "https://ipfs.kimlikdao.org";

/**
 * @return {!Promise<void>}
 */
const testYazOku = () => {
  /** @const {string} */
  const text = "Everything not saved will be lost";
  return ipfs.yaz(IPFS_URL, text, "text/plain")
    .then((h) => ipfs.cidBytetanOku(IPFS_URL, h))
    .then((/** string */ gelen) => assertEq(gelen, text));
}

testCID();
testYazOku();

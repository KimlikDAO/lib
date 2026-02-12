import { expect, test } from "bun:test";
import ipfs from "../ipfs";

test("CID test", () => {
  /** @const {TextEncoder} */
  const encoder = new TextEncoder();

  ipfs.hash(encoder.encode("a".repeat(2680)))
    .then((/** @type {Uint8Array} */ hash) => expect(ipfs.CID(hash))
      .toBe("Qmawd3DRAY5YwtCzQe8gBumMXA1JCrzvbH2WQR6ZTykVoG"));
  ipfs.hash(encoder.encode("KimlikDAO\n"))
    .then((/** @type {Uint8Array} */ hash) => expect(ipfs.CID(hash))
      .toBe("QmafCiqeYQtiXokAEUB4ToMcZJREhJcShbzvjrYmC1WCsi"));
  ipfs.hash(encoder.encode("foo\n"))
    .then((/** @type {Uint8Array} */ hash) => expect(ipfs.CID(hash))
      .toBe("QmYNmQKp6SuaVrpgWRsPTgCQCnpxUYGq76YEKBXuj2N4H6"));
  ipfs.hash(encoder.encode("a".repeat(31337)))
    .then((/** @type {Uint8Array} */ hash) => expect(ipfs.CID(hash))
      .toBe("Qmbq6rxwg5uKYAEhdFvPnBqzbJWAPfhB4LwF4yGamvzWSR"));
});

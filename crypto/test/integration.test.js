import { expect, it, test } from "bun:test";
import abi from "../../ethereum/abi";
import { addr, sign, signWide } from "../../ethereum/mock/signer";
import signature from "../../ethereum/signature";
import { signerAddress } from "../../ethereum/signer";

test("address derivation from private key", () => {
  expect(addr(1n)).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  expect(addr(2n)).toBe("0x2b5ad5c4795c026514f8317c7a215e218dccd6cf");
  expect(addr(3n)).toBe("0x6813eb9362372eef6200f3b1dbc3f819671cba69");
  expect(addr(4n)).toBe("0x1eff47bc3a10a45d4b230b5d10e37751fe6aa718");
  expect(addr(5n)).toBe("0xe1ab8145f7e55dc933d51a18c793f901a3a0b276");
  expect(addr(6n)).toBe("0xe57bfe9f44b819898f47bf37e5af72a0783e1141");
});

test("compact signature conversion methods", () => {
  /** @const {bigint} */
  const d = 123123n;
  /** @const {bigint} */
  const pk = 456456n;

  expect(signature.fromWide(signWide(d, pk))).toBe(sign(d, pk));
});

it("should recover signer address correctly", () => {
  /** @const {bigint} */
  const digest = 103n;
  expect(signerAddress(abi.uint256(digest), sign(digest, 101n)))
    .toBe(addr(101n));
  expect(signerAddress(digest.toString(16), sign(digest, 1337n)))
    .toBe(addr(1337n));
});

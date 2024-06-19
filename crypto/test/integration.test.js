import { expect, it, test } from "bun:test";
import evm from "../../ethereum/evm";
import vm from "../../testing/vm";

test("address derivation from private key", () => {
  expect(vm.addr(1n)).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  expect(vm.addr(2n)).toBe("0x2b5ad5c4795c026514f8317c7a215e218dccd6cf");
  expect(vm.addr(3n)).toBe("0x6813eb9362372eef6200f3b1dbc3f819671cba69");
  expect(vm.addr(4n)).toBe("0x1eff47bc3a10a45d4b230b5d10e37751fe6aa718");
  expect(vm.addr(5n)).toBe("0xe1ab8145f7e55dc933d51a18c793f901a3a0b276");
  expect(vm.addr(6n)).toBe("0xe57bfe9f44b819898f47bf37e5af72a0783e1141");
});

test("compact signature conversion methods", () => {
  /** @const {!bigint} */
  const d = 123123n;
  /** @const {!bigint} */
  const pk = 456456n;

  expect(evm.compactSignature("0x" + vm.signWide(d, pk)))
    .toBe(vm.signCompact(d, pk));
});

it("should recover signer address correctly", () => {
  /** @const {!bigint} */
  const digest = 103n;
  expect(evm.signerAddress(evm.uint256(digest), vm.signCompact(digest, 101n)))
    .toBe(vm.addr(101n));
  expect(evm.signerAddress(digest.toString(16), vm.signCompact(digest, 1337n)))
    .toBe(vm.addr(1337n));
});

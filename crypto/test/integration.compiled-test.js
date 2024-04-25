import evm from "../../ethereum/evm";
import { assertEq } from "../../testing/assert";
import vm from "../../testing/vm";

const testAddr = () => {
  assertEq(vm.addr(1n), "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  assertEq(vm.addr(2n), "0x2b5ad5c4795c026514f8317c7a215e218dccd6cf");
  assertEq(vm.addr(3n), "0x6813eb9362372eef6200f3b1dbc3f819671cba69");
  assertEq(vm.addr(4n), "0x1eff47bc3a10a45d4b230b5d10e37751fe6aa718");
  assertEq(vm.addr(5n), "0xe1ab8145f7e55dc933d51a18c793f901a3a0b276");
  assertEq(vm.addr(6n), "0xe57bfe9f44b819898f47bf37e5af72a0783e1141");
}

const testToCompactSignature = () => {
  /** @const {!bigint} */
  const d = 123123n;
  /** @const {!bigint} */
  const pk = 456456n;

  assertEq(
    evm.compactSignature("0x" + vm.signWide(d, pk)),
    vm.signCompact(d, pk)
  );
}

const testSignRecover = () => {
  /** @const {!bigint} */
  const digest = 103n;

  assertEq(
    evm.signerAddress(evm.uint256(digest), vm.signCompact(digest, 101n)),
    vm.addr(101n)
  );

  assertEq(
    evm.signerAddress(digest.toString(16), vm.signCompact(digest, 1337n)),
    vm.addr(1337n)
  );
}

testAddr();
testToCompactSignature();
testSignRecover();

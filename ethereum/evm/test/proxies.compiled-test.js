import { assert, assertEq } from "../../../testing/assert";
import { hexten } from "../../../util/çevir";
import { Op, OpData } from "../opcodes";
import { delegateCall, upgradableProxy } from "../proxies";
import { evm } from "../types";

const testDelegateCall = () => {
  const dc1 = delegateCall(0, evm.bytes.from([]));

  assertEq(dc1[dc1[dc1.length - 5]], Op.JUMPDEST);

  const dc2 = delegateCall(0, evm.bytes.from(["012301231231"]));

  assertEq(dc2[dc2[dc2.length - 5]], Op.JUMPDEST);

}

const testUpgradableProxy = () => {
  const erc1967 = hexten("0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
  /** 
   * @const
   * @type {OpData}
   */
  const up = upgradableProxy("0x1234567890123456789012345678901234567890", erc1967);
  /** @const {OpData} */
  const dc = delegateCall(0, erc1967);

  const copyIdx = up.indexOf(up.length - dc.length);

  assert(copyIdx != -1);
  assertEq(up[copyIdx - 3], dc.length);
}

testDelegateCall();
testUpgradableProxy();

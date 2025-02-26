import { expect, test } from "bun:test";
import hex from "../../../util/hex";
import { Op, OpData } from "../opcodes";
import { delegateCall, upgradableProxy } from "../proxies";
import { evm } from "../types";

test("delegate call", () => {
  const dc1 = delegateCall(0, evm.bytes.from([]));
  expect(dc1[dc1[dc1.length - 5]]).toBe(Op.JUMPDEST);

  const dc2 = delegateCall(0, evm.bytes.from(["012301231231"]));
  expect(dc2[dc2[dc2.length - 5]]).toBe(Op.JUMPDEST);
});

test("upgradable Proxy generator", () => {
  const erc1967 = hex.toUint8Array("0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
  /** 
   * @const
   * @type {OpData}
   */
  const up = upgradableProxy("0x1234567890123456789012345678901234567890", erc1967);
  /** @const {OpData} */
  const dc = delegateCall(0, erc1967);

  const copyIdx = up.indexOf(up.length - dc.length);

  expect(copyIdx).not.toBe(-1);
  expect(up[copyIdx - 3]).toBe(dc.length);
});

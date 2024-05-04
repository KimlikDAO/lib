import { describe, expect, test } from "bun:test";
import vm from "../../../testing/vm";
import { hex } from "../../../util/çevir";
import { Op } from "../opcodes";
import { delegateCall, upgradableProxy } from "../proxies";

describe("", () => {
  test("", () => {
    const dc = delegateCall(0);
    expect(dc[dc[dc.length - 5]]).toBe(parseInt(Op.JUMPDEST, 16));
  });

  test("output", async () => {
    const up = upgradableProxy(vm.addr(1));
    console.log(hex(up.subarray(32)))
  })
})

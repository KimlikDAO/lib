import { expect, test } from "bun:test";
import { returnOrRevert } from "../builtins";
import { Op } from "../opcodes";

test("returnOrRevert emits a packaged conditional termination", () => {
  const out = returnOrRevert(true, 0, 1);

  expect(String(out.signature())).toBe("() → 0|⊢");
  expect(out.code.filter((atom) => typeof atom == "number")).toEqual([
    Op.PUSH1,
    Op.PUSH0,
    Op.PUSH1,
    Op.JUMPI,
    Op.REVERT,
    Op.JUMPDEST,
    Op.RETURN,
  ]);
});

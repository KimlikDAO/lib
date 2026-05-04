import { expect, test } from "bun:test";
import { Op } from "../opcodes";
import { Ops } from "../ops";

test("opcode fragments print with top of stack on the right", () => {
  expect(String(Ops[Op.MSTORE]!.signature())).toBe("(Data, Locn) → 2|");
  expect(String(Ops[Op.CALL]!.signature()))
    .toBe("(Size, Locn, Size, Locn, Weis, Addr, Uint) → 7|Bool");
});

test("terminal opcode fragments have symbolic ensures", () => {
  expect(String(Ops[Op.STOP]!.signature())).toBe("() → 0|⊤");
  expect(String(Ops[Op.RETURN]!.signature())).toBe("(Size, Locn) → 2|⊤");
  expect(String(Ops[Op.REVERT]!.signature())).toBe("(Size, Locn) → 2|⊣");
  expect(String(Ops[Op.INVALID]!.signature())).toBe("() → 0|⊥");
  expect(String(Ops[Op.SELFDESTRUCT]!.signature())).toBe("(Addr) → 1|⊤");
});

test("opcode fragments specialize known word kinds", () => {
  expect(String(Ops[Op.ADD]!.signature())).toBe("(Uint, Uint) → 2|Uint");
  expect(String(Ops[Op.BYTE]!.signature())).toBe("(, Uint) → 2|Uint");
  expect(String(Ops[Op.DIFFICULTY]!.signature())).toBe("() → 0|Uint");
  expect(String(Ops[Op.GASPRICE]!.signature())).toBe("() → 0|Weis");
});

test("opcode helper derives pop count and single-op code", () => {
  expect(Ops[Op.STOP]!.pop).toBe(0);
  expect(Ops[Op.STOP]!.code).toEqual([Op.STOP]);
  expect(Ops[Op.MSTORE]!.pop).toBe(2);
  expect(Ops[Op.MSTORE]!.code).toEqual([Op.MSTORE]);
});

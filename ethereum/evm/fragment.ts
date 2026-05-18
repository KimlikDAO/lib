import { parseEther } from "../denominations";
import { Op, OpData, PUSHN } from "./opcodes";
import {
  EnsureNames,
  HaltState,
  Signature,
  TypeList,
  compose as composeSignatures,
} from "./signature";
import {
  Addr, AddrLit,
  Bool, BoolLit,
  Bytes,
  DataLit,
  EvmType,
  Literal,
  Locn,
  Size, SizeLit,
  Uint, UintLit,
  Weis, WeisLit,
} from "./types";
import { assert } from "./util/assert";

type CodeAtom =
  | Op
  | OpData
  | LabelPos
  | LabelRef

type FlatCode = readonly CodeAtom[];

class Fragment {
  constructor(
    readonly signature: Signature,
    readonly code: FlatCode,
  ) { }

  static from({
    expect = [],
    pop = 0,
    ensure = [],
    ensureNames = Array(ensure.length).fill(undefined),
    halt = undefined,
    code = [],
  }: {
    expect?: TypeList;
    pop?: number;
    ensure?: TypeList;
    ensureNames?: EnsureNames;
    halt?: HaltState;
    code?: FlatCode;
  }): Fragment {
    return new Fragment(
      new Signature(expect, pop, ensure, ensureNames, halt),
      code,
    );
  }
  static fromLiteral(lit: Literal, type: EvmType): Fragment {
    switch (type) {
      case Size:
        return Fragment.from({
          ensure: [Size], code: pushNumber(lit as SizeLit)
        });
      case Uint:
        return Fragment.from({
          ensure: [Uint], code: pushNumber(uintValue(lit as UintLit))
        });
      case Weis: {
        let value = lit as WeisLit;
        if (typeof value == "string") {
          const parsed = parseEther(value);
          assert(parsed != -1n, `Invalid wei amount: ${value}`);
          value = parsed;
        }
        return Fragment.from({
          ensure: [Weis], code: pushNumber(value)
        });
      }
      case Bool:
        return Fragment.from({
          ensure: [Bool], code: pushNumber(+(lit as BoolLit))
        });
      case Addr:
        return Fragment.from({
          ensure: [Addr], code: pushAddress(lit as AddrLit)
        });
      default: {
        const value = lit as DataLit;
        const code = value instanceof Uint8Array
          ? pushBytes(value)
          : typeof value == "string" ? pushHex(value) : pushNumber(value);
        return Fragment.from({ ensure: [type], code });
      }
    }
  }
  static ofLabelPos(labelId: number, jump: boolean): Fragment {
    return Fragment.from({
      ensure: [Locn], code: [new LabelRef(labelId, jump)]
    });
  }
  static ofLabelRef(labelId: number): Fragment {
    return Fragment.from({ code: [new LabelPos(labelId), Op.JUMPDEST] });
  }
}

const pushBytes = (bytes: Bytes): FlatCode => {
  let len = bytes.length;
  assert(len <= 32, `Bytes literal exceeds 32 bytes: ${bytes}`);
  let start = 0;
  while (len && bytes[start] == 0) { ++start; --len; }
  return len ? [PUSHN(len), bytes.subarray(start)] : [Op.PUSH0];
}

const pushNumber = (n: bigint | number, maxLength = 32): FlatCode => {
  if (n == 0) return [Op.PUSH0];
  let hexValue = n.toString(16);
  assert(!hexValue.startsWith("-"), `cannot PUSH negative value ${n}`);
  if (hexValue.length & 1) hexValue = "0" + hexValue;
  const opData = Uint8Array.fromHex(hexValue);
  assert(opData.length <= maxLength,
    `Number literal ${n} exceeds ${maxLength} bytes`);
  return [PUSHN(opData.length), opData];
};

const uintValue = (value: UintLit): bigint | number =>
  value instanceof Uint ? value.toBigInt() : value;

const pushHex = (hex: string): FlatCode => {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length & 1) hex = "0" + hex;
  return pushBytes(Uint8Array.fromHex(hex));
}

const pushAddress = (addr: AddrLit): FlatCode => {
  if (addr instanceof Uint8Array) {
    assert(addr.length == 20,
      `Byte length must be 20 for Addr literal: ${addr}`);
    return pushBytes(addr);
  }
  if (typeof addr == "bigint") return pushNumber(addr, 20);
  assert(addr.length == 42,
    `Expected a length 42 address starting in 0x, received ${addr}`);
  return pushHex(addr);
}

class LabelRef {
  serializedLength = 1;
  absoluteAddress = 0;

  constructor(
    readonly labelId: number,
    readonly jump: boolean,
  ) { }
}

class LabelPos {
  constructor(
    readonly labelId: number
  ) { }
}

const compose = (...frags: Fragment[]): Fragment => {
  const signature = composeSignatures(...frags.map((frag) => frag.signature));
  return new Fragment(signature, frags.flatMap((frag) => frag.code));
}

export {
  CodeAtom,
  FlatCode,
  Fragment,
  LabelPos,
  LabelRef,
  compose
};

import bigints from "../../util/bigints";
import { Address } from "../address.d";
import { parseEther } from "../denominations";
import { Op, OpData, dupN, pushN } from "./opcodes";

const InspectCustom = Symbol.for("nodejs.util.inspect.custom");

const assert = (expr: boolean, message?: string) => {
  if (!expr) throw message;
}

type EvmType =
  | typeof Word
  | typeof Uint
  | typeof Weis
  | typeof Locn
  | typeof Size
  | typeof Addr
  | typeof Bool;

type Bytes = Uint8Array<ArrayBuffer>;

class Word {
  static name = "Word";
  data: Bytes;
  constructor(value: number | bigint | Bytes) {
    if (value instanceof Uint8Array) {
      this.data = value;
      return;
    }
    this.data = new Uint8Array(32);
    switch (typeof value) {
      case "number":
      case "bigint":
        bigints.intoBytesBE(this.data, value, 32); return;
      default:
        throw `Cannot convert ${value} to Word`;
    }
  }
}

class Addr extends Word {
  static override name = "Addr";
}

class Uint extends Word {
  static override name = "Uint";
}

class Weis extends Uint {
  static override name = "Weis";
}

class Locn extends Uint {
  static override name = "Locn";
}

class Size extends Uint {
  static override name = "Size";
}

class Bool extends Word {
  static override name = "Bool";
}

type WeisArg = Fragment | StackRef | bigint | string;
type LocnArg = Fragment | StackRef | bigint | number;
type SizeArg = Fragment | StackRef | bigint | number;
type UintArg = Fragment | StackRef | bigint | number;
type AddrArg = Fragment | StackRef | Address | Bytes | bigint;
type BoolArg = Fragment | StackRef | boolean;
type WordArg = Fragment | StackRef | Bytes | number | bigint | string;
type Arg = Fragment | StackRef | Bytes | boolean | number | bigint | string;

type ExpectList = readonly (EvmType | undefined)[];
type EnsureList = readonly EvmType[];

class Signature {
  constructor(
    readonly expect: ExpectList,
    readonly ensure: EnsureList,
    readonly pop: number,
  ) { }

  static args(types: ExpectList): string {
    return types.map((type) => type ? type.name : "").join(", ");
  }
  toString(): string {
    return `(${Signature.args(this.expect)}) → ` +
      `${Signature.args(this.ensure)}|${this.pop}`;
  }
  [InspectCustom](): string {
    return this.toString();
  }
}

type CodeAtom =
  | Op
  | OpData
  | Data
  | Label
  | LabelRef

type FlatCode = readonly CodeAtom[];
type Code = readonly (CodeAtom | Fragment)[];

class Fragment {
  constructor(
    readonly expect: ExpectList,
    readonly ensure: EnsureList,
    readonly pop: number,
    readonly code: FlatCode,
  ) { }

  signature(): Signature {
    return new Signature(this.expect, this.ensure, this.pop);
  }
  static from({ expect, ensure, pop, code }: {
    expect: ExpectList,
    ensure: EnsureList,
    pop: number,
    code: FlatCode
  }) { return new Fragment(expect, ensure, pop, code); }

  /**
   * Creates a fragment out of a single StackRef. An {@link EvmType} must be
   * provided, which will be expected at the referred stack position and
   * and will be ensured at the output.
   *
   * The signatures are as follows:
   *   {@link StackRefMode.Get}: (,,,type) → type|0
   *                             copy the value to tos.
   *   {@link StackRefMode.Eat}: (,,,type) → type|pos
   *                             pop until the value, and output the value
   *   {@link StackRefMode.Use}: (,,,type) → type|pos if pos ≤ 2
   *                             (,,,type) → type|0   otherwise
   */
  static fromStackRef(sref: StackRef, type: EvmType): Fragment {
    const pos = sref.pos;
    const expect = Array(pos);
    expect[pos - 1] = type; // (,,,,type)
    const ensure = [type];
    const mode = sref.mode == StackRefMode.Use
      ? pos <= 2 ? StackRefMode.Eat : StackRefMode.Get
      : sref.mode;
    switch (mode) {
      case StackRefMode.Get:
        return new Fragment(expect, ensure, 0, [dupN(sref.pos)]);
      case StackRefMode.Eat:
        const code = new Array<Op>(pos - 1).fill(Op.POP);
        return new Fragment(expect, ensure, pos, code);
      default: throw "unreachable"
    }
  }
  static fromBoolArg(arg: BoolArg): Fragment {
    if (arg instanceof Fragment) return arg;
    if (arg instanceof StackRef)
      return Fragment.fromStackRef(arg, Bool)
    switch (typeof arg) {
      case "boolean": return new Fragment([], [Bool], 0, pushNumber(+arg));
      default:
        throw `Invalid literal for BoolArg: ${arg}`;
    }
  }
  private static fromUintArg(arg: UintArg, type: EvmType): Fragment {
    if (arg instanceof Fragment) return arg;
    if (arg instanceof StackRef) return Fragment.fromStackRef(arg, type);
    switch (typeof arg) {
      case "bigint":
      case "number":
        return new Fragment([], [type], 0, pushNumber(arg));
      default:
        throw `Invalid literal for ${type.name}Arg: ${arg}`;
    }
  }
  static fromArg(arg: Arg, type: EvmType): Fragment {
    switch (type) {
      case Size: return Fragment.fromUintArg(arg as SizeArg, Size);
      case Locn: return Fragment.fromUintArg(arg as LocnArg, Size);
      case Weis: return Fragment.fromWeisArg(arg as WeisArg);
      case Uint: return Fragment.fromUintArg(arg as UintArg, Uint);
      case Bool: return Fragment.fromBoolArg(arg as BoolArg);
      case Addr: return Fragment.fromAddrArg(arg as AddrArg);
      default: return Fragment.fromWordArg(arg as WordArg);
    }
  }
  static fromSizeArg(arg: SizeArg): Fragment {
    return Fragment.fromUintArg(arg, Size);
  }
  static fromLocnArg(arg: LocnArg): Fragment {
    return Fragment.fromUintArg(arg, Locn);
  }
  static fromWeisArg(arg: WeisArg): Fragment {
    if (arg instanceof Fragment) return arg;
    if (arg instanceof StackRef) return Fragment.fromStackRef(arg, Weis);
    switch (typeof arg) {
      case "string":
        const parsed = parseEther(arg);
        assert(parsed != -1n, `Invalid wei amount: ${arg}`);
        arg = parsed;
      case "bigint":
        return new Fragment([], [Weis], 0, pushNumber(arg));
      default:
        throw `Invalid literal for WeisArg: ${arg}`;
    }
  }
  static fromAddrArg(arg: AddrArg): Fragment {
    if (arg instanceof Fragment) return arg;
    if (arg instanceof StackRef) return Fragment.fromStackRef(arg, Addr);
    if (arg instanceof Uint8Array) {
      assert(arg.length == 20, `Byte length must be 20 for AddrArg: ${arg}`);
      return new Fragment([], [Addr], 0, [Op.PUSH20, arg]);
    }
    switch (typeof arg) {
      case "bigint":
      case "string":
        return new Fragment([], [Addr], 0, [Op.PUSH20, address(arg)]);
      default:
        throw `Invalid literal for AddrArg: ${arg}`;
    }
  }
  static fromWordArg(arg: WordArg): Fragment {
    if (arg instanceof Fragment) return arg;
    if (arg instanceof StackRef) return Fragment.fromStackRef(arg, Word);
    if (arg instanceof Uint8Array)
      return new Fragment([], [Word], 0, pushBytes(arg));
    switch (typeof arg) {
      case "string":
    }
    throw `Invalid literal for WordArg: ${arg}`;
  }
}

const pushBytes = (bytes: Bytes): FlatCode => {
  const len = bytes.length;
  if (len == 0 || len == 1 && bytes[0] == 0) return [Op.PUSH0];
  return [pushN(len), bytes];
}

const pushNumber = (n: bigint | number): FlatCode => {
  if (n == 0) return [Op.PUSH0];
  let hexValue = n.toString(16);
  assert(!hexValue.startsWith("-"), `cannot PUSH negative value ${n}`);
  if (hexValue.length & 1) hexValue = "0" + hexValue;
  const opData = Uint8Array.fromHex(hexValue);
  return [pushN(opData.byteLength), opData];
};

enum StackRefMode {
  Use = 0,
  Get = 1,
  Eat = 2,
}

class StackRef {
  type: EvmType | undefined;
  constructor(
    readonly pos: number,
    readonly mode: StackRefMode,
  ) { }

  bindType(type: EvmType) { this.type = type; }
}

class LabelRef {
  serializedLength = 1;
  absoluteAddress = 0;

  constructor(
    readonly labelId: number,
    readonly jump: boolean,
  ) { }
}

class Label {
  static next = 0;
  static names: (string | undefined)[] = [];

  static describe(label: Label): string {
    return label.name ? `label "${label.name}"` : "anonymous label";
  }

  readonly id: number;
  constructor(readonly name?: string) {
    this.id = Label.next++;
    if (name) Label.names[this.id] = name;
  }

  ref(jump = false): Fragment {
    return new Fragment([], [Locn], 0, [new LabelRef(this.id, jump)]);
  }
  dest(): Fragment {
    return new Fragment([], [], 0, [this, Op.JUMPDEST]);
  }
}

class Data {
  readonly label: Label;

  constructor(
    readonly data: Bytes,
    name?: string,
  ) {
    this.label = new Label(name);
  }

  beg(): Fragment {
    return this.label.ref();
  }
  len(): Fragment {
    return Fragment.fromSizeArg(this.data.length);
  }
}

const address = (addr: Address | bigint): Bytes => {
  if (typeof addr == "bigint") {
    const bytes = new Uint8Array(20);
    bigints.intoBytesBE(bytes, addr, 20);
    return bytes;
  }
  assert(addr.length == 42,
    `Expected a length 42 address starting in 0x, received ${addr}`);
  return Uint8Array.fromHex(addr.slice(2));
};

/**
 * Creates a data blob in the program from a fixed byte array. Its symbolic
 * start index can be obtained by the `beg()` method on the returned object.
 */
const data = (bytes: Bytes, name?: string): Data => new Data(bytes, name);

const label = (name?: string): Label => new Label(name);

/**
 * Use value in stack position n. The caller is free to consume it.
 */
const use = (n: number): StackRef => new StackRef(n, StackRefMode.Use);

/**
 * Read the value in stack position n, without consuming it.
 */
const get = (n: number): StackRef => new StackRef(n, StackRefMode.Get);

/**
 * Use the value at stack position n and ensure the value is removed from the
 * stack.
 */
const eat = (n: number): StackRef => new StackRef(n, StackRefMode.Eat);

export {
  Addr,
  AddrArg,
  Arg,
  Bool,
  BoolArg,
  Bytes,
  Code,
  Data,
  EvmType,
  FlatCode,
  Fragment,
  Label,
  LabelRef,
  Locn,
  LocnArg,
  Signature,
  Size,
  SizeArg,
  StackRef,
  StackRefMode,
  Weis,
  WeisArg,
  Word,
  WordArg,
  address,
  data,
  eat,
  get,
  label,
  use
};

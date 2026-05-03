import bigints from "../../util/bigints";
import { Address } from "../address.d";
import { parseEther } from "../denominations";
import { Op, OpData, pushN } from "./opcodes";

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

type WeisLit = bigint | string;
type LocnLit = bigint | number;
type SizeLit = bigint | number;
type UintLit = bigint | number;
type AddrLit = Address | Bytes | bigint;
type BoolLit = boolean;
type WordLit = Bytes | number | bigint | string;
type Lit =
  | WeisLit
  | LocnLit
  | SizeLit
  | UintLit
  | AddrLit
  | BoolLit
  | WordLit;

type WeisArg = WeisLit | Fragment | StackRef;
type LocnArg = LocnLit | Fragment | StackRef;
type SizeArg = SizeLit | Fragment | StackRef;
type UintArg = UintLit | Fragment | StackRef;
type AddrArg = AddrLit | Fragment | StackRef;
type BoolArg = BoolLit | Fragment | StackRef;
type WordArg = WordLit | Fragment | StackRef;
type Arg = Lit | Fragment | StackRef;

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

  static fromBoolLit(lit: BoolLit): Fragment {
    return new Fragment([], [Bool], 0, pushNumber(+lit));
  }
  private static fromUintLikeLit(lit: UintLit, type: EvmType): Fragment {
    return new Fragment([], [type], 0, pushNumber(lit));
  }
  static fromUintLit(lit: UintLit): Fragment {
    return Fragment.fromUintLikeLit(lit, Uint);
  }
  static fromLit(lit: Lit, type: EvmType): Fragment {
    switch (type) {
      case Size: return Fragment.fromSizeLit(lit as SizeLit);
      case Locn: return Fragment.fromLocnLit(lit as LocnLit);
      case Weis: return Fragment.fromWeisLit(lit as WeisLit);
      case Uint: return Fragment.fromUintLit(lit as UintLit);
      case Bool: return Fragment.fromBoolLit(lit as BoolLit);
      case Addr: return Fragment.fromAddrLit(lit as AddrLit);
      default: return Fragment.fromWordLit(lit as WordLit);
    }
  }
  static fromSizeLit(lit: SizeLit): Fragment {
    return Fragment.fromUintLikeLit(lit, Size);
  }
  static fromLocnLit(lit: LocnLit): Fragment {
    return Fragment.fromUintLikeLit(lit, Locn);
  }
  static fromWeisLit(lit: WeisLit): Fragment {
    if (typeof lit == "string") {
      const parsed = parseEther(lit);
      assert(parsed != -1n, `Invalid wei amount: ${lit}`);
      lit = parsed;
    }
    return new Fragment([], [Weis], 0, pushNumber(lit));
  }
  static fromAddrLit(lit: AddrLit): Fragment {
    if (lit instanceof Uint8Array) {
      assert(lit.length == 20, `Byte length must be 20 for AddrLit: ${lit}`);
      return new Fragment([], [Addr], 0, [Op.PUSH20, lit]);
    }
    return new Fragment([], [Addr], 0, [Op.PUSH20, address(lit)]);
  }
  static fromWordLit(lit: WordLit): Fragment {
    if (lit instanceof Uint8Array)
      return new Fragment([], [Word], 0, pushBytes(lit));
    const code = typeof lit == "string" ? pushHex(lit) : pushNumber(lit);
    return new Fragment([], [Word], 0, code);
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

const pushHex = (hex: string): FlatCode => {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length & 1) hex = "0" + hex;
  const bytes = Uint8Array.fromHex(hex);
  assert(bytes.length <= 32, `WordLit hex literal exceeds 32 bytes: ${hex}`);
  return pushBytes(bytes);
}

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
    return Fragment.fromSizeLit(this.data.length);
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
  AddrLit,
  Arg,
  Bool,
  BoolArg,
  BoolLit,
  Bytes,
  Code,
  Data,
  EvmType,
  FlatCode,
  Fragment,
  Label,
  LabelRef,
  Lit,
  Locn,
  LocnArg,
  LocnLit,
  Signature,
  Size,
  SizeArg,
  SizeLit,
  StackRef,
  StackRefMode,
  Uint,
  UintArg,
  UintLit,
  Weis,
  WeisArg,
  WeisLit,
  Word,
  WordArg,
  WordLit,
  address,
  data,
  eat,
  get,
  label,
  use
};

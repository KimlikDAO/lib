import { Address } from "../address.d";
import { parseEther } from "../denominations";
import { Op, OpData, pushN } from "./opcodes";

const InspectCustom = Symbol.for("nodejs.util.inspect.custom");

const assert = (expr: boolean, message: string = "no good") => {
  if (!expr) throw message;
}

type EvmType =
  | typeof Word
  | typeof Data
  | typeof Uint
  | typeof Weis
  | typeof Locn
  | typeof Size
  | typeof Addr
  | typeof Bool;

type Bytes = Uint8Array<ArrayBuffer>;

class Word {
  static name = "";
  constructor(private word: Bytes) { }

  toString() { return "" + this.word; }
}

class Data extends Word {
  static override name = "Data";
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
type DataLit = Bytes | number | bigint | string;
type Lit =
  | WeisLit
  | LocnLit
  | SizeLit
  | UintLit
  | AddrLit
  | BoolLit
  | DataLit;

type WeisArg = WeisLit | Fragment | StackRef;
type LocnArg = LocnLit | Fragment | StackRef;
type SizeArg = SizeLit | Fragment | StackRef;
type UintArg = UintLit | Fragment | StackRef;
type AddrArg = AddrLit | Fragment | StackRef;
type BoolArg = BoolLit | Fragment | StackRef;
type DataArg = DataLit | Fragment | StackRef;
type Arg = Lit | Fragment | StackRef;

type TypeList = readonly EvmType[];
type Ensures = TypeList | "⊣" | "⊥" | "⊤";

class Signature {
  constructor(
    readonly expect: TypeList,
    readonly ensure: Ensures,
    readonly pop: number,
  ) { }

  static args(types: TypeList): string {
    return types.map((type) => type.name).join(", ");
  }
  toString(): string {
    return `(${Signature.args(this.expect)}) → ${this.pop}|` + (
      typeof this.ensure == "string"
        ? this.ensure : Signature.args(this.ensure)
    );
  }
  [InspectCustom](): string {
    return this.toString();
  }
}

type CodeAtom =
  | Op
  | OpData
  | Blob
  | Label
  | LabelRef

type FlatCode = readonly CodeAtom[];
type Code = readonly (CodeAtom | Fragment)[];

class Fragment {
  constructor(
    readonly expect: TypeList,
    readonly ensure: Ensures,
    readonly pop: number,
    readonly code: FlatCode,
  ) { }

  signature(): Signature {
    return new Signature(this.expect, this.ensure, this.pop);
  }
  static fromLit(lit: Lit, type: EvmType): Fragment {
    switch (type) {
      case Size: return new Fragment([], [Size], 0, pushNumber(lit as SizeLit));
      case Locn: return new Fragment([], [Locn], 0, pushNumber(lit as LocnLit));
      case Uint: return new Fragment([], [Uint], 0, pushNumber(lit as UintLit));
      case Weis: {
        let value = lit as WeisLit;
        if (typeof value == "string") {
          const parsed = parseEther(value);
          assert(parsed != -1n, `Invalid wei amount: ${value}`);
          value = parsed;
        }
        return new Fragment([], [Weis], 0, pushNumber(value));
      }
      case Bool:
        return new Fragment([], [Bool], 0, pushNumber(+(lit as BoolLit)));
      case Addr:
        return new Fragment([], [Addr], 0, pushAddress(lit as AddrLit));
      case Data: {
        const value = lit as DataLit;
        const code = value instanceof Uint8Array
          ? pushBytes(value)
          : typeof value == "string" ? pushHex(value) : pushNumber(value);
        return new Fragment([], [Data], 0, code);
      }
      default: throw "Word is not constructible from literals";
    }
  }
}

const pushBytes = (bytes: Bytes): FlatCode => {
  let len = bytes.length;
  assert(len <= 32, `Bytes literal exceeds 32 bytes: ${bytes}`);
  let start = 0;
  while (len && bytes[start] == 0) { ++start; --len; }
  return len ? [pushN(len), bytes.subarray(start)] : [Op.PUSH0];
}

const pushNumber = (n: bigint | number, maxLength = 32): FlatCode => {
  if (n == 0) return [Op.PUSH0];
  let hexValue = n.toString(16);
  assert(!hexValue.startsWith("-"), `cannot PUSH negative value ${n}`);
  if (hexValue.length & 1) hexValue = "0" + hexValue;
  const opData = Uint8Array.fromHex(hexValue);
  assert(opData.length <= maxLength,
    `Number literal ${n} exceeds ${maxLength} bytes`);
  return [pushN(opData.length), opData];
};

const pushHex = (hex: string): FlatCode => {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length & 1) hex = "0" + hex;
  return pushBytes(Uint8Array.fromHex(hex));
}

const pushAddress = (addr: AddrLit): FlatCode => {
  if (addr instanceof Uint8Array) {
    assert(addr.length == 20, `Byte length must be 20 for AddrLit: ${addr}`);
    return pushBytes(addr);
  }
  if (typeof addr == "bigint") return pushNumber(addr, 20);
  assert(addr.length == 42,
    `Expected a length 42 address starting in 0x, received ${addr}`);
  return pushHex(addr);
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

class Blob {
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
    return Fragment.fromLit(this.data.length, Size);
  }
}

/**
 * Creates a byte blob in the program from a fixed byte array. Its symbolic
 * start index can be obtained by the `beg()` method on the returned object.
 */
const blob = (bytes: Bytes, name?: string): Blob => new Blob(bytes, name);

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
  Blob,
  Bool,
  BoolArg,
  BoolLit,
  Bytes,
  Code,
  Data,
  DataArg,
  DataLit,
  Ensures,
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
  blob,
  eat,
  get,
  label,
  use
};

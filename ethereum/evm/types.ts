import { Address } from "../address.d";

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

type EvmType =
  | typeof Word
  | typeof Data
  | typeof Uint
  | typeof Weis
  | typeof Locn
  | typeof Size
  | typeof Addr
  | typeof Bool;

const isAssignable = (sup: EvmType, sub: EvmType): boolean =>
  sub === sup || sup.isPrototypeOf(sub);

const narrowType = (
  a: EvmType,
  b: EvmType,
  context = "conflicting expectation",
): EvmType => {
  if (isAssignable(a, b)) return b;
  if (isAssignable(b, a)) return a;
  throw new TypeError(`${context}: ${a.name} vs ${b.name}`);
}

type AddrLit = Address | Bytes | bigint;
type BoolLit = boolean;
type DataLit = Bytes | number | bigint | string;
type LocnLit = bigint | number;
type SizeLit = bigint | number;
type UintLit = bigint | number;
type WeisLit = bigint | string;
type Literal =
  | AddrLit
  | BoolLit
  | DataLit
  | LocnLit
  | SizeLit
  | UintLit
  | WeisLit;

export {
  Addr, AddrLit,
  Bool, BoolLit,
  Bytes,
  Data, DataLit,
  EvmType,
  Literal,
  Locn, LocnLit,
  Size, SizeLit,
  Uint, UintLit,
  Weis, WeisLit,
  Word,
  isAssignable,
  narrowType,
};

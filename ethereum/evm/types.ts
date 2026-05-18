import { Address } from "../address.d";

type Bytes = Uint8Array<ArrayBuffer>;

const wordBytes = (value: bigint): Bytes => {
  const out = new Uint8Array(32);
  for (let i = 31; 0 <= i; --i) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

class Word {
  static name = "";
  constructor(private word: Bytes) { }

  toBigInt(): bigint {
    let value = 0n;
    for (const byte of this.word)
      value = (value << 8n) | BigInt(byte);
    return value;
  }

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

  static from(value: Uint | bigint | number): Uint {
    return value instanceof Uint ? value : new Uint(wordBytes(BigInt(value)));
  }

  static of(value: Uint | bigint | number): Uint {
    return Uint.from(value);
  }

  shr(value: Uint): Uint {
    const shift = this.toBigInt();
    return Uint.from(256n <= shift ? 0n : value.toBigInt() >> shift);
  }
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

const typeName = (type: EvmType): string => type.name || "Word";

const assertAssignable = (
  sup: EvmType,
  sub: EvmType,
  context = "type mismatch",
) => {
  if (!isAssignable(sup, sub))
    throw new TypeError(
      `${context}: expected ${typeName(sup)}, received ${typeName(sub)}`);
}

const narrowType = (
  a: EvmType,
  b: EvmType,
  context = "conflicting expectation",
): EvmType => {
  if (isAssignable(a, b)) return b;
  if (isAssignable(b, a)) return a;
  throw new TypeError(`${context}: ${typeName(a)} vs ${typeName(b)}`);
}

type AddrLit = Address | Bytes | bigint;
type BoolLit = boolean;
type DataLit = Bytes | number | bigint | string;
type LocnLit = bigint | number;
type SizeLit = bigint | number;
type UintLit = Uint | bigint | number;
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
  assertAssignable,
  isAssignable,
  narrowType,
  typeName,
};

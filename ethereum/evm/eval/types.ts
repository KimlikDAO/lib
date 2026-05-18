import {
  Addr as AddrType,
  Bool as BoolType,
  type Bytes,
  Data as DataType,
  Locn as LocnType,
  Size as SizeType,
  Uint as UintType,
  Weis as WeisType,
  Word as WordType,
} from "../types";

type Word = WordType;
const Word = WordType;

type Data = DataType;
const Data = DataType;

type Addr = AddrType;
const Addr = AddrType;

type Bool = BoolType;
const Bool = BoolType;

type Uint = number;
const Uint = UintType;

type Locn = number;
const Locn = LocnType;

type Size = number;
const Size = SizeType;

type Weis = WeisType | bigint | number;
const Weis = WeisType;

export {
  Addr,
  Bool,
  Data,
  Locn,
  Size,
  Uint,
  Weis,
  Word,
};

export type { Bytes };

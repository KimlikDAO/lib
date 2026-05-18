import { keccak256Uint8 } from "../../../crypto/sha3";
import {
  asUint,
  exactBytes,
  memorySlice,
  memoryStore,
  resetMemory,
  uint,
  wordBytes,
} from "./evm";
import { Bool, Data, Uint, Word, type Bytes } from "./types";

class ReturnData extends Error {
  constructor(readonly data: Bytes) {
    super("EVM RETURN");
  }
}

const mstore = (offset: Uint, value: Word): void => {
  memoryStore(offset, value);
}

const keccak256 = (offset: Uint, size: Uint): Data => {
  return new Data(exactBytes(keccak256Uint8(memorySlice(offset, size))));
}

const ret = (offset: Uint, size: Uint): never => {
  throw new ReturnData(memorySlice(offset, size));
}

const bitAnd = (lhs: Uint, rhs: Uint): Uint => uint(asUint(lhs) & asUint(rhs));

const mul = (lhs: Uint, rhs: Uint): Uint => uint(asUint(lhs) * asUint(rhs));

const sub = (lhs: Uint, rhs: Uint): Uint => uint(asUint(lhs) - asUint(rhs));

const shr = (shift: Uint, value: Uint): Uint =>
  uint(Uint.from(shift).shr(Uint.from(value)).toBigInt());

const eq = (lhs: Word, rhs: Word): Bool =>
  new Bool(wordBytes(lhs.toBigInt() == rhs.toBigInt() ? 1n : 0n));

function range(stop: number): number[];
function range(start: number, stop: number, step?: number): number[];
function range(startOrStop: number, stop?: number, step = 1): number[] {
  if (step == 0)
    throw new RangeError("range step cannot be 0");
  const start = stop === undefined ? 0 : startOrStop;
  const end = stop === undefined ? startOrStop : stop;
  const out: number[] = [];
  if (0 < step)
    for (let i = start; i < end; i += step)
      out.push(i);
  else
    for (let i = start; end < i; i += step)
      out.push(i);
  return out;
}

export {
  bitAnd,
  eq,
  keccak256,
  mstore,
  mul,
  range,
  resetMemory,
  ret,
  ReturnData,
  shr,
  sub,
};

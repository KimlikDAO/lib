import { Address } from "../address.d";
import { Op, PUSHN } from "./opcodes";
import { Bytes, FlatCode } from "./types";
import { assert } from "./util";

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

const pushHex = (hex: string): FlatCode => {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length & 1) hex = "0" + hex;
  return pushBytes(Uint8Array.fromHex(hex));
}

const pushAddress = (addr: AddrLit): FlatCode => {
  if (addr instanceof Uint8Array) {
    assert(addr.length == 20, `Byte length must be 20 for Addr literal: ${addr}`);
    return pushBytes(addr);
  }
  if (typeof addr == "bigint") return pushNumber(addr, 20);
  assert(addr.length == 42,
    `Expected a length 42 address starting in 0x, received ${addr}`);
  return pushHex(addr);
}

export {
  AddrLit,
  BoolLit,
  DataLit,
  Lit,
  LocnLit,
  SizeLit,
  UintLit,
  WeisLit,
  pushAddress,
  pushBytes,
  pushHex,
  pushNumber,
};

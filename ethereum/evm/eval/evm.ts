import { Data, Uint, type Bytes, type Word } from "./types";

const U256 = 1n << 256n;

type EvmArray<T extends Word> = {
  readonly [index: number]: T;
};

const wordBytes = (value: bigint): Bytes => {
  const out = new Uint8Array(32);
  value = ((value % U256) + U256) % U256;
  for (let i = 31; 0 <= i; --i) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

const exactBytes = (bytes: Uint8Array): Bytes => new Uint8Array(bytes);

const asUint = (value: Uint): bigint => Uint.from(value).toBigInt();

const asOffset = (value: Uint): number => {
  const offset = asUint(value);
  if (BigInt(Number.MAX_SAFE_INTEGER) < offset)
    throw new RangeError("memory offset is too large");
  return Number(offset);
}

const uint = (value: bigint): Uint => {
  value = ((value % U256) + U256) % U256;
  if (BigInt(Number.MAX_SAFE_INTEGER) < value)
    throw new RangeError("Uint is too large for the eval shim");
  return Number(value);
}

let memory: Bytes = new Uint8Array(0);

const ensureMemory = (length: number): void => {
  if (length <= memory.length) return;
  const next = new Uint8Array(length);
  next.set(memory);
  memory = next;
}

const memoryStore = (offset: Uint, value: Word): void => {
  const start = asOffset(offset);
  ensureMemory(start + 32);
  memory.set(wordBytes(value.toBigInt()), start);
}

const memoryLoad = (offset: Uint): Word => {
  const start = asOffset(offset);
  ensureMemory(start + 32);
  return new Data(exactBytes(memory.slice(start, start + 32)));
}

const memorySlice = (offset: Uint, size: Uint): Bytes => {
  const start = asOffset(offset);
  const end = start + asOffset(size);
  ensureMemory(end);
  return exactBytes(memory.slice(start, end));
}

const resetMemory = (): void => {
  memory = new Uint8Array(0);
}

const mem = new Proxy({}, {
  get(_target, key) {
    if (typeof key != "string") return undefined;
    return memoryLoad(Number(key));
  },
  set(_target, key, value) {
    if (typeof key != "string") return false;
    memoryStore(Number(key), value as Word);
    return true;
  },
}) as any;

const evm = {
  array<T extends Word>(
    _type: abstract new (...args: any[]) => T,
    _length: number,
  ): EvmArray<T> {
    return [] as unknown as EvmArray<T>;
  },

  calldata<T>(_schema: unknown): T {
    return {} as T;
  },

  storage<T>(_schema: unknown): T {
    return {} as T;
  },
};

export {
  EvmArray,
  asUint,
  evm,
  exactBytes,
  mem,
  memorySlice,
  memoryStore,
  resetMemory,
  uint,
  wordBytes,
};

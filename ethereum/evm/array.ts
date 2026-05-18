import { CalldataRef } from "./expression";
import type { Arg } from "./expression";
import { EvmType } from "./types";

class ArrayType<T extends EvmType> {
  constructor(
    readonly element: T,
    readonly length: number,
  ) {
    if (!Number.isSafeInteger(length) || length < 0)
      throw new RangeError(`invalid array length ${length}`);
  }
}

abstract class ArrayRef<T extends EvmType> {
  abstract readonly type: ArrayType<T>;
  abstract at(index: number): Arg<T>;
}

class CalldataArrayRef<T extends EvmType> extends ArrayRef<T> {
  constructor(
    readonly offset: number,
    readonly type: ArrayType<T>,
  ) {
    super();
  }

  at(index: number): CalldataRef<T> {
    if (!Number.isSafeInteger(index) || index < 0 || this.type.length <= index)
      throw new RangeError(`array index ${index} out of bounds`);
    return new CalldataRef(this.offset + 32 * index, this.type.element);
  }
}

type AnyArrayType = ArrayType<EvmType>;
type AnyArrayRef = ArrayRef<EvmType>;
type AnyCalldataArrayRef = CalldataArrayRef<EvmType>;
type CalldataField = readonly [number, EvmType | AnyArrayType];
type CalldataLayout<S extends Record<string, CalldataField>> = {
  readonly [K in keyof S]: S[K][1] extends ArrayType<infer T>
  ? CalldataArrayRef<T>
  : S[K][1] extends EvmType
  ? CalldataRef<S[K][1]>
  : never;
};

const array = <T extends EvmType>(
  element: T,
  length: number,
): ArrayType<T> => new ArrayType(element, length);

const calldata = <S extends Record<string, CalldataField>>(
  schema: S,
): CalldataLayout<S> => {
  const out: Record<string, CalldataRef | AnyCalldataArrayRef> = {};
  for (const [name, [offset, field]] of Object.entries(schema)) {
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new RangeError(`invalid calldata offset ${offset}`);
    out[name] = field instanceof ArrayType
      ? new CalldataArrayRef(offset, field)
      : new CalldataRef(offset, field);
  }
  return out as CalldataLayout<S>;
}

const isArrayType = (value: unknown): value is AnyArrayType =>
  value instanceof ArrayType;

const isArrayRef = (value: unknown): value is AnyArrayRef =>
  value instanceof ArrayRef;

export {
  CalldataLayout,
  ArrayRef,
  ArrayType,
  CalldataArrayRef,
  AnyArrayRef,
  AnyArrayType,
  array,
  calldata,
  isArrayRef,
  isArrayType,
};

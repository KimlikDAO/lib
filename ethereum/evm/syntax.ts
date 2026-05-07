import { parseEther } from "../denominations";
import type {
  AddrLit,
  BoolLit,
  DataLit,
  Lit,
  LocnLit,
  SizeLit,
  UintLit,
  WeisLit,
} from "./literals";
import {
  pushAddress,
  pushBytes,
  pushHex,
  pushNumber,
} from "./literals";
import {
  Addr,
  Bool,
  Bytes,
  EvmType,
  Fragment,
  Label,
  Size,
  Uint,
  Weis,
} from "./types";
import { assert } from "./util";

enum StackRefMode {
  Dup = 0,
  Use = 1,
}

class StackRef {
  constructor(
    readonly name: string,
    readonly mode: StackRefMode,
  ) { }
}

type AddrArg = AddrLit | StackRef | Expression;
type BoolArg = BoolLit | StackRef | Expression;
type DataArg = DataLit | StackRef | Expression;
type LocnArg = LocnLit | StackRef | Expression;
type SizeArg = SizeLit | StackRef | Expression;
type UintArg = UintLit | StackRef | Expression;
type WeisArg = WeisLit | StackRef | Expression;
type Arg = Lit | StackRef | Expression;
type ExprArg = Lit | StackRef | Expression;
class Expression {
  readonly args: readonly (StackRef | Expression)[];

  constructor(
    args: readonly ExprArg[],
    readonly frag: Fragment,
  ) {
    const normalized: (StackRef | Expression)[] = [];
    let arity = 0;
    for (const arg of args) {
      if (arg instanceof StackRef) {
        normalized.push(arg);
        ++arity;
        continue;
      }
      if (arg instanceof Expression) {
        normalized.push(arg);
        arity += arg.frag.ensure.length;
        continue;
      }
      assert(arity < frag.expect.length,
        `Expression expected ${frag.expect.length} child values, received ${arity + 1}`);
      normalized.push(Expression.fromLit(arg, frag.expect[arity]!));
      ++arity;
    }
    assert(arity == frag.expect.length,
      `Expression expected ${frag.expect.length} child values, received ${arity}`);
    this.args = normalized;
  }

  static fromFragment(frag: Fragment): Expression {
    return new Expression([], frag);
  }

  static fromLit(lit: Lit, type: EvmType): Expression {
    switch (type) {
      case Size: return new Expression([], new Fragment([], 0, [Size], pushNumber(lit as SizeLit)));
      case Uint: return new Expression([], new Fragment([], 0, [Uint], pushNumber(lit as UintLit)));
      case Weis: {
        let value = lit as WeisLit;
        if (typeof value == "string") {
          const parsed = parseEther(value);
          assert(parsed != -1n, `Invalid wei amount: ${value}`);
          value = parsed;
        }
        return new Expression([], new Fragment([], 0, [Weis], pushNumber(value)));
      }
      case Bool:
        return new Expression([], new Fragment([], 0, [Bool], pushNumber(+(lit as BoolLit))));
      case Addr:
        return new Expression([], new Fragment([], 0, [Addr], pushAddress(lit as AddrLit)));
      default: {
        const value = lit as DataLit;
        const code = value instanceof Uint8Array
          ? pushBytes(value)
          : typeof value == "string" ? pushHex(value) : pushNumber(value);
        return new Expression([], new Fragment([], 0, [type], code));
      }
    }
  }
}

const dup = (name: string): StackRef => new StackRef(name, StackRefMode.Dup);

const use = (name: string): StackRef => new StackRef(name, StackRefMode.Use);

function set(name: string, expr: Expression | Fragment): Expression;
function set(name: string, type: EvmType, lit: Lit): Expression;
function set(
  name: string,
  valueOrType: Expression | Fragment | EvmType,
  lit?: Lit,
): Expression {
  const expr = valueOrType instanceof Expression
    ? valueOrType
    : valueOrType instanceof Fragment
      ? Expression.fromFragment(valueOrType)
      : lit !== undefined
        ? Expression.fromLit(lit, valueOrType)
        : (() => {
          throw new TypeError(`set(${name}) requires a type for literals`);
        })();
  if (expr.frag.ensure.length != 1)
    throw new TypeError(`set(${name}) expected one ensured value`);
  return new Expression(
    expr.args,
    new Fragment(
      expr.frag.expect,
      expr.frag.pop,
      expr.frag.ensure,
      expr.frag.code,
      expr.frag.halt,
      [name],
    ),
  );
}

const ifThen = (_cond: BoolArg, _then: Expression): Expression => {
  throw new TypeError("ifThen is not implemented yet");
}

const ifElse = (_cond: BoolArg, _t: Expression, _f: Expression): Expression => {
  throw new TypeError("ifElse is not implemented yet");
}

type SeqItem = Expression | Fragment | Blob;

const unrollFor = <T>(
  init: SeqItem | readonly SeqItem[],
  arr: T[],
  fn: (elm: T) => SeqItem | readonly SeqItem[],
): SeqItem[] => {
  const initArr = Array.isArray(init) ? [...init] : [init];
  return [...initArr, ...arr.flatMap((elm) => {
    const out = fn(elm);
    return Array.isArray(out) ? [...out] : [out];
  })];
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
    return new Fragment([], 0, [Size], pushNumber(this.data.length));
  }
}

/**
 * Creates a byte blob in the program from a fixed byte array. Its symbolic
 * start index can be obtained by the `beg()` method on the returned object.
 */
const blob = (bytes: Bytes, name?: string): Blob => new Blob(bytes, name);

export {
  Blob,
  Expression,
  StackRef,
  StackRefMode,
  blob,
  dup,
  ifElse,
  ifThen,
  set,
  unrollFor,
  use,
};

export type {
  AddrArg,
  AddrLit,
  Arg,
  BoolArg,
  BoolLit,
  DataArg,
  DataLit,
  ExprArg,
  Lit,
  LocnArg,
  LocnLit,
  SizeArg,
  SizeLit,
  UintArg,
  UintLit,
  WeisArg,
  WeisLit,
};

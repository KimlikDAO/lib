import { Fragment } from "./fragment";
import { TypeList } from "./signature";
import {
  AddrLit,
  BoolLit,
  DataLit,
  EvmType,
  Literal,
  LocnLit,
  SizeLit,
  UintLit,
  WeisLit,
  assertAssignable,
} from "./types";
import { assert } from "./util/assert";

class StackRef {
  constructor(
    readonly name: string,
  ) { }
}

type AddrArg = AddrLit | StackRef | Expression;
type BoolArg = BoolLit | StackRef | Expression;
type DataArg = DataLit | StackRef | Expression;
type LocnArg = LocnLit | StackRef | Expression;
type SizeArg = SizeLit | StackRef | Expression;
type UintArg = UintLit | StackRef | Expression;
type WeisArg = WeisLit | StackRef | Expression;
type ExprArg = Literal | StackRef | Expression;

type ExprChild = StackRef | Expression;

class Expression {
  readonly children: readonly ExprChild[];

  get ensure(): TypeList {
    return this.frag.signature.ensure;
  }
  constructor(
    args: readonly ExprArg[],
    readonly frag: Fragment,
  ) {
    const { expect, pop } = frag.signature;
    assert(pop == expect.length,
      `Expression fragment pop ${pop} does not match expect length`
      + ` ${expect.length}`);

    const expected = expect.length;
    let arity = 0;
    for (const arg of args)
      arity += arg instanceof Expression ? arg.ensure.length : 1;

    assert(arity == expected,
      `Expression expected ${expected} child values, received ${arity}`);

    const children: ExprChild[] = [];
    let pos = 0;
    for (const arg of args)
      if (arg instanceof StackRef) {
        children.push(arg);
        ++pos;
      } else if (arg instanceof Expression) {
        children.push(arg);
        for (const type of arg.ensure)
          assertAssignable(expect[pos++]!, type,
            `Expression child at position ${pos}`);
      } else
        children.push(Expression.fromLiteral(arg, expect[pos++]!));
    this.children = children;
  }

  static fromLiteral(lit: Literal, type: EvmType): Expression {
    return new Expression([], Fragment.fromLiteral(lit, type));
  }
  static fromFragment(frag: Fragment): Expression {
    return new Expression([], frag);
  }
}

const hook = (
  cond: BoolArg,
  trueExpr: ExprArg,
  falseExpr: ExprArg
): ExprArg => {
  if (cond instanceof StackRef || cond instanceof Expression)
    throw new TypeError("not implemented");
  return cond ? trueExpr : falseExpr;
}

const get = (name: string): StackRef => new StackRef(name);

export {
  AddrArg,
  BoolArg,
  DataArg,
  ExprArg,
  ExprChild,
  Expression,
  LocnArg,
  SizeArg,
  StackRef,
  UintArg,
  WeisArg,
  get,
  hook,
};

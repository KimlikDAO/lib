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
} from "./types";
import { assert } from "./util";

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
    const children: ExprChild[] = [];
    let arity = 0;
    for (const arg of args)
      if (arg instanceof StackRef) {
        children.push(arg);
        ++arity;
      } else if (arg instanceof Expression) {
        children.push(arg);
        arity += arg.ensure.length;
      } else {
        children.push(
          Expression.fromLiteral(arg, frag.signature.expect[arity]));
        ++arity;
      }
    const expected = frag.signature.expect.length;
    assert(arity == expected,
      `Expression expected ${expected} child values, received ${arity}`);
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
  trueExpr: ExprChild,
  falseExpr: ExprChild
): ExprChild => {
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

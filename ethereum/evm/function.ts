import { bind, collectNames } from "./binder";
import { ExprArg, Expression, StackRef, get } from "./expression";
import { Fragment, compose } from "./fragment";
import { Op } from "./opcodes";
import { Body, flattenBody, scopeFrom } from "./scope";
import { EvmType, Word } from "./types";

type ParamSchema = Record<string, EvmType>;
type InlineParams<S extends ParamSchema> = {
  readonly [K in keyof S]: StackRef;
};
type InlineFunction = (...args: ExprArg[]) => Expression;

const inline = <S extends ParamSchema>(
  schema: S,
  fn: (params: InlineParams<S>) => Body,
): InlineFunction => {
  const names = Object.keys(schema);
  const types = names.map((name) => schema[name]!);
  const params = Object.fromEntries(
    names.map((name) => [name, get(name)]),
  ) as InlineParams<S>;
  const prefix = Fragment.from({
    expect: types,
    pop: types.length,
    ensure: types,
    ensureNames: names,
  });
  const frag = returnedFragment(prefix, fn(params));
  return (...args: ExprArg[]) => new Expression(args, frag);
}

const returnedFragment = (prefix: Fragment, body: Body): Fragment => {
  const statements = flattenBody(body);
  const last = statements.at(-1);
  if (!(last instanceof Expression))
    throw new TypeError("inline body must end with an expression");
  if (last.ensure.length != 1)
    throw new TypeError(
      `inline return expected one output, received ${last.ensure.length}`);
  const prefixFrag = scopeFrom(
    prefix, statements.slice(0, -1), collectNames(last));
  return onlyTop(compose(
    prefixFrag,
    bind(prefixFrag.signature, last, new Set()),
  ));
}

const onlyTop = (frag: Fragment): Fragment => {
  const { ensure } = frag.signature;
  if (ensure.length <= 1)
    return frag;
  const out = ensure[ensure.length - 1]!;
  const trim = Fragment.from({
    expect: [Word, out],
    pop: 2,
    ensure: [out],
    code: [Op.SWAP1, Op.POP],
  });
  return compose(frag, ...Array(ensure.length - 1).fill(trim));
}

export {
  InlineFunction,
  InlineParams,
  ParamSchema,
  inline
};

import { bind, collectNames } from "./binder";
import { ExprArg, Expression, StackRef, get } from "./expression";
import { Fragment, compose } from "./fragment";
import {
  ArrayRef,
  ArrayType,
  AnyArrayRef,
  AnyArrayType,
  isArrayRef,
  isArrayType,
} from "./array";
import { Op } from "./opcodes";
import { Body, bodyFrom, flattenBody } from "./body";
import { EvmType, Word } from "./types";

type ParamSpec = EvmType | AnyArrayType;
type ParamSchema = Record<string, ParamSpec>;
type InlineArrayParam<T extends AnyArrayType> = T extends ArrayType<infer E>
  ? ArrayRef<E>
  : never;
type InlineParam<T extends ParamSpec> = T extends AnyArrayType
  ? InlineArrayParam<T>
  : StackRef;
type InlineParams<S extends ParamSchema> = {
  readonly [K in keyof S]: InlineParam<S[K]>;
};
type InlineArg = ExprArg | AnyArrayRef;
type InlineFunction = (...args: InlineArg[]) => Expression;

const inline = <S extends ParamSchema>(
  schema: S,
  fn: (params: InlineParams<S>) => Body,
): InlineFunction => {
  const names = Object.keys(schema);
  const valueNames: string[] = [];
  const valueTypes: EvmType[] = [];
  const arrayNames: string[] = [];
  for (const name of names) {
    const spec = schema[name]!;
    if (isArrayType(spec))
      arrayNames.push(name);
    else {
      valueNames.push(name);
      valueTypes.push(spec);
    }
  }

  if (arrayNames.length == 0) {
    const frag = returnedFragment(
      scalarPrefix(valueNames, valueTypes),
      fn(valueParams(valueNames, valueTypes) as InlineParams<S>),
    );
    return (...args: InlineArg[]) => {
      if (args.length != names.length)
        throw new TypeError(
          `inline expected ${names.length} arguments, received ${args.length}`);
      for (let i = 0; i < names.length; ++i)
        if (isArrayRef(args[i]))
          throw new TypeError(`inline parameter ${names[i]} expects a value`);
      return new Expression(args as ExprArg[], frag);
    }
  }

  return (...args: InlineArg[]) => {
    if (args.length != names.length)
      throw new TypeError(
        `inline expected ${names.length} arguments, received ${args.length}`);

    const params: Record<string, StackRef | AnyArrayRef> = {};
    const valueArgs: ExprArg[] = [];
    for (let i = 0; i < names.length; ++i) {
      const name = names[i]!;
      const spec = schema[name]!;
      const arg = args[i]!;
      if (isArrayType(spec)) {
        if (!isArrayRef(arg))
          throw new TypeError(`inline parameter ${name} expects an array`);
        if (arg.type.element !== spec.element || arg.type.length != spec.length)
          throw new TypeError(`inline parameter ${name} array type mismatch`);
        params[name] = arg;
      } else {
        if (isArrayRef(arg))
          throw new TypeError(`inline parameter ${name} expects a value`);
        valueArgs.push(arg);
        params[name] = get(name, spec);
      }
    }

    const frag = returnedFragment(
      scalarPrefix(valueNames, valueTypes),
      fn(params as InlineParams<S>),
    );
    return new Expression(valueArgs, frag);
  }
}

const valueParams = (
  names: readonly string[],
  types: readonly EvmType[],
): Record<string, StackRef> =>
  Object.fromEntries(names.map((name, i) => [name, get(name, types[i]!)]));

const scalarPrefix = (
  names: readonly string[],
  types: readonly EvmType[],
): Fragment => Fragment.from({
  expect: types,
  pop: types.length,
  ensure: types,
  ensureNames: names,
});

const returnedFragment = (prefix: Fragment, body: Body): Fragment => {
  const statements = flattenBody(body);
  const last = statements.at(-1);
  if (!(last instanceof Expression))
    throw new TypeError("inline body must end with an expression");
  if (last.ensure.length != 1)
    throw new TypeError(
      `inline return expected one output, received ${last.ensure.length}`);
  const prefixFrag = bodyFrom(
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

import { dupN, Op, swapN } from "./opcodes";
import {
  Arg,
  CodeAtom,
  Data,
  EvmType,
  Fragment,
  StackRef,
  StackRefMode,
  Word,
  assertAssignable,
  narrowType,
} from "./types";

type Gap = undefined;
type BindArg = Arg | Gap;

const inferArg = (arg: BindArg, type: EvmType, index: number): Fragment | StackRef => {
  if (arg === undefined) {
    if (type != Word)
      throw new TypeError(`blank argument requires Word at position ${index + 1}`);
    return new Fragment([], 0, [Data], [Op.PUSH0]);
  }
  if (arg instanceof StackRef) {
    if (!Number.isInteger(arg.pos) || arg.pos < 1)
      throw new RangeError(`stack position must be a positive integer: ${arg.pos}`);
    arg.bindType(type);
    return arg;
  }
  if (arg instanceof Fragment) {
    if (arg.pop)
      throw new TypeError(`bound fragment at position ${index + 1} must have pop = 0`);
    if (arg.ensure.length != 1)
      throw new TypeError(
        `bound fragment at position ${index + 1} must ensure one value`,
      );
    if (arg.halt)
      throw new TypeError(`bound fragment at position ${index + 1} must not halt`);
    assertAssignable(arg.ensure[0]!, type,
      `bound fragment at position ${index + 1}`);
    return arg;
  }
  return Fragment.fromLit(arg, type == Word ? Data : type);
}

const expectFromRefs = (refs: readonly StackRef[]): EvmType[] => {
  const len = refs.reduce((max, ref) => Math.max(max, ref.pos), 0);
  const expect = Array<EvmType>(len).fill(Word);
  for (const ref of refs) {
    const index = len - ref.pos;
    expect[index] = narrowType(expect[index]!, ref.type!,
      `conflicting get(${ref.pos}) expectation`);
  }
  return expect;
}

const tryAllGet = (
  args: readonly (Fragment | StackRef)[],
  f: Fragment,
): Fragment | null => {
  if (!args.every((arg) =>
    arg instanceof StackRef && arg.mode == StackRefMode.Get))
    return null;

  const refs = args as readonly StackRef[];
  const code: CodeAtom[] = [];
  for (let i = 0; i < refs.length; ++i)
    code.push(dupN(refs[i]!.pos + i));
  code.push(...f.code);
  return new Fragment(expectFromRefs(refs), 0, f.ensure, code, f.halt);
}

const trySingleStackRef = (
  args: readonly (Fragment | StackRef)[],
  f: Fragment,
): Fragment | null => {
  const refs = args.filter((arg): arg is StackRef => arg instanceof StackRef);
  if (refs.length > 1) return null;

  const ref = refs[0];
  const code: CodeAtom[] = [];

  if (!ref) {
    for (const arg of args)
      code.push(...(arg as Fragment).code);
    code.push(...f.code);
    return new Fragment([], 0, f.ensure, code, f.halt);
  }

  let pushed = 0;

  for (const arg of args) {
    if (arg instanceof Fragment) {
      code.push(...arg.code);
      ++pushed;
      continue;
    }

    if (arg.mode == StackRefMode.Get) {
      code.push(dupN(arg.pos + pushed));
      ++pushed;
      continue;
    }

    for (let i = 1; i < arg.pos + pushed; ++i)
      code.push(swapN(i));
    ++pushed;
  }

  code.push(...f.code);
  if (ref.mode == StackRefMode.Get) {
    const expect = Array<EvmType>(ref.pos).fill(Word);
    expect[0] = ref.type!;
    return new Fragment(expect, 0, f.ensure, code, f.halt);
  }
  const expect = Array<EvmType>(ref.pos).fill(Word);
  expect[0] = ref.type!;
  return new Fragment(expect, ref.pos,
    Array<EvmType>(ref.pos - 1).fill(Word).concat(f.ensure), code, f.halt);
}

const bind = (args: readonly BindArg[], f: Fragment): Fragment => {
  if (args.length != f.expect.length)
    throw new TypeError(
      `bind expected ${f.expect.length} arguments, received ${args.length}`);

  const inferred = Array.from(args, (arg, i) => inferArg(arg, f.expect[i], i));
  return trySingleStackRef(inferred, f) ??
    tryAllGet(inferred, f) ??
    (() => { throw new TypeError("unsupported bind pattern"); })();
}

export { bind, BindArg, Gap };

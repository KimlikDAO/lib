import { Arg, EvmType, Fragment, StackRef } from "./types";
import { Word } from "./types";

type Combinable = Fragment | StackRef;

const assertAssignable = (
  found: EvmType,
  expected: EvmType,
  context: string,
) => {
  if (found != expected && expected != Word)
    throw new TypeError(
      `${context}: expected ${expected.name}, found ${found.name}`,
    );
}

const mergeExpect = (
  expect: EvmType[],
  pos: number,
  type: EvmType,
) => {
  while (expect.length < pos) expect.push(Word);
  const found = expect[pos];
  if (found == Word) expect[pos] = type;
  else if (type == Word) return;
  else if (found) assertAssignable(found, type, `conflicting expectation at stack position ${pos + 1}`);
  else expect[pos] = type;
}

const infer = (arg: Arg, type: EvmType): Combinable => {
  if (arg instanceof StackRef)
    arg.bindType(type);
  else if (!(arg instanceof Fragment))
    arg = Fragment.fromLit(arg, type);
  return arg;
}

const composePair = (left: Fragment, right: Fragment): Fragment => {
  const expect = left.expect.slice();

  for (let i = 0; i < right.expect.length; ++i) {
    const type = right.expect[i];

    if (i < left.ensure.length)
      assertAssignable(left.ensure[i]!, type,
        `fragment output at stack position ${i + 1}`);
    else
      mergeExpect(expect, left.pop + i - left.ensure.length, type);
  }

  const pop = left.pop + Math.max(0, right.pop - left.ensure.length);
  const ensure = right.ensure.concat(left.ensure.slice(right.pop));
  const code = left.code.concat(right.code);
  return new Fragment(expect, ensure, pop, code);
}

const compose = (...frags: Fragment[]): Fragment => {
  let out = new Fragment([], [], 0, []);
  for (const frag of frags)
    out = composePair(out, frag);
  return out;
}

const combine = (..._combs: Combinable[]): Fragment => {
  return new Fragment([], [], 0, []);
}

export { combine, compose, infer };

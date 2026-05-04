import { Arg, EvmType, Fragment, StackRef, Word } from "./types";

type Combinable = Fragment | StackRef;

const assertAssignable = (
  found: EvmType,
  expected: EvmType,
  context: string,
) => {
  if (found != expected && expected != Word &&
    !(found.prototype instanceof expected))
    throw new TypeError(
      `${context}: expected ${expected.name}, found ${found.name}`,
    );
}

const mergeExpect = (
  expect: EvmType[],
  depth: number,
  type: EvmType,
) => {
  while (expect.length <= depth) expect.unshift(Word);
  const pos = expect.length - 1 - depth;
  const found = expect[pos]!;
  if (found == Word) expect[pos] = type;
  else if (type == Word) return;
  else assertAssignable(found, type, `conflicting expectation at stack position ${depth + 1}`);
}

const infer = (arg: Arg, type: EvmType): Combinable => {
  if (arg instanceof StackRef)
    arg.bindType(type);
  else if (!(arg instanceof Fragment))
    arg = Fragment.fromLit(arg, type);
  return arg;
}

const composePair = (left: Fragment, right: Fragment): Fragment => {
  const code = left.code.concat(right.code);
  if (typeof left.ensure == "string")
    return new Fragment(left.expect, left.ensure, left.pop, code);

  const expect = left.expect.slice();
  const leftEnsures = left.ensure.length;
  const rightExpects = right.expect.length;
  const translated = Math.max(0, rightExpects - leftEnsures);

  for (let i = 0; i < translated; ++i) {
    const depth = left.pop + translated - 1 - i;
    mergeExpect(expect, depth, right.expect[i]!);
  }

  const producedExpects = right.expect.slice(translated);
  const producedEnsures = left.ensure.slice(leftEnsures - producedExpects.length);
  for (let i = 0; i < producedExpects.length; ++i) {
    const depth = producedExpects.length - 1 - i;
    assertAssignable(producedEnsures[i]!, producedExpects[i]!,
      `fragment output at stack position ${depth + 1}`);
  }

  const pop = left.pop + Math.max(0, right.pop - leftEnsures);
  const ensure = typeof right.ensure == "string"
    ? right.ensure
    : left.ensure
      .slice(0, Math.max(0, leftEnsures - right.pop))
      .concat(right.ensure);
  return new Fragment(expect, ensure, pop, code);
}

const compose = (...frags: Fragment[]): Fragment => {
  if (!frags.length) return new Fragment([], [], 0, []);

  let out = new Fragment([], [], 0, []);
  for (const fragment of frags)
    out = composePair(out, fragment);
  return out;
}

const combine = (..._combs: Combinable[]): Fragment => {
  return new Fragment([], [], 0, []);
}

export { combine, compose, infer };

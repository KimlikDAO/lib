import { compose } from "./composer";
import { DUPN, Op, SWAPN } from "./opcodes";
import { Ops } from "./ops";
import { Expression, StackRef, StackRefMode } from "./syntax";
import type { Arg } from "./syntax";
import {
  CodeAtom,
  EvmType,
  Fragment,
  isAssignable,
  Word,
} from "./types";
import { assert } from "./util";

type BindArg = Arg | undefined;

const MaxSearchArity = 9;
const MaxSearchCost = 160;
const MaxSearchStates = 300_000;
const MaxTargetStates = 4096;

type SearchNode = {
  readonly stack: readonly number[];
  readonly cost: number;
  readonly key: number;
};

type SearchParent = readonly [number, readonly CodeAtom[]];

function lowerExpression(expr: Expression): Fragment {
  return bind(expr.args, expr.frag);
}

const materializeFragment = (
  frag: Fragment,
  index: number,
  type: EvmType,
): Fragment => {
  if (frag.expect.length)
    throw new TypeError(
      `bound fragment at position ${index + 1} must have expect = []`);
  if (frag.pop)
    throw new TypeError(
      `bound fragment at position ${index + 1} must have pop = 0`);
  if (frag.ensure.length != 1)
    throw new TypeError(
      `bound fragment at position ${index + 1} must ensure one value`);
  if (frag.halt)
    throw new TypeError(
      `bound fragment at position ${index + 1} must not halt`);
  if (!isAssignable(type, frag.ensure[0]!))
    throw new TypeError(`bound fragment at position ${index + 1}`);
  return frag;
}

const materializeArg = (
  arg: BindArg,
  index: number,
  type: EvmType,
): Fragment | StackRef | undefined => {
  if (arg === undefined || arg instanceof StackRef)
    return arg;
  if (arg instanceof Expression)
    return materializeFragment(lowerExpression(arg), index, type);
  return materializeArg(Expression.fromLit(arg, type), index, type);
}

const countSymbol = (stack: readonly number[], symbol: number): number => {
  let count = 0;
  for (const value of stack)
    if (value == symbol) ++count;
  return count;
}

const encodeStack = (stack: readonly number[]): number => {
  let encoded = 0;
  let shift = 1;
  for (let i = 0; i < MaxSearchArity; ++i) {
    const value = i < stack.length ? stack[i]! : 31;
    const lane = value < 0 ? MaxSearchArity - value : value;
    encoded += lane * shift;
    shift *= 32;
  }
  return encoded;
}

const symbolCounts = (stack: readonly number[]): Map<number, number> => {
  const counts = new Map<number, number>();
  for (const symbol of stack)
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
  return counts;
}

const makeConcreteTargets = (
  target: readonly number[],
  blankSymbols: readonly number[],
): number[][] | null => {
  const targets: number[][] = [[]];
  for (const symbol of target) {
    const n = targets.length;
    const symbols = symbol == 0 ? blankSymbols : [symbol];
    if (n * symbols.length > MaxTargetStates)
      return null;
    for (let i = 0; i < n; ++i) {
      const prefix = targets[i]!;
      prefix.push(symbols[0]!);
      for (let j = 1; j < symbols.length; ++j)
        targets.push([...prefix.slice(0, -1), symbols[j]!]);
    }
  }
  return targets;
}

const tryAllUse = (
  args: readonly (Fragment | StackRef | undefined)[],
  f: Fragment,
): Fragment | null => {
  if (!args.every((arg) =>
    !(arg instanceof StackRef) || arg.mode == StackRefMode.Use))
    return null;
  if (args.some((arg) => arg instanceof StackRef))
    return null;
  if (args.length > MaxSearchArity)
    return null;

  const maxUse = 0;
  if (maxUse > MaxSearchArity)
    return null;

  const expect = Array<EvmType>(maxUse).fill(Word);
  const target: number[] = [];
  const exprs: Fragment[] = [];
  const required = new Map<number, number>();
  let blankCount = 0;

  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (arg === undefined) {
      assert(f.expect[i] == Word,
        `blank argument requires Word at position ${i + 1}`);
      target.push(0);
      ++blankCount;
      continue;
    }
    if (arg instanceof Fragment) {
      const symbol = -exprs.length - 1;
      exprs.push(arg);
      target.push(symbol);
      required.set(symbol, 1);
      continue;
    }

    return null;
  }

  const goal = (stack: readonly number[]): boolean =>
    stack.length == target.length && target.every((symbol, i) =>
      symbol == 0 || stack[i] == symbol);

  const initial = Array.from({ length: maxUse }, (_, i) => maxUse - i);
  const blankSymbols = Array.from({ length: maxUse + 1 }, (_, i) => i);
  const concreteTargets = makeConcreteTargets(target, blankSymbols);
  if (!concreteTargets)
    return null;

  const initialCounts = symbolCounts(initial);
  const maxCount = (symbol: number): number =>
    (required.get(symbol) ?? 0) + (initialCounts.get(symbol) ?? 0) + blankCount;
  const isExpr = (symbol: number): boolean => symbol < 0;

  const forwardBuckets: SearchNode[][] = Array.from(
    { length: MaxSearchCost + 1 },
    () => [],
  );
  const backwardBuckets: SearchNode[][] = Array.from(
    { length: MaxSearchCost + 1 },
    () => [],
  );
  const forwardDist = new Map<number, number>();
  const backwardDist = new Map<number, number>();
  const forwardParent = new Map<number, SearchParent>();
  const backwardParent = new Map<number, SearchParent>();
  const initialKey = encodeStack(initial);
  forwardBuckets[0]!.push({
    stack: initial,
    cost: 0,
    key: initialKey,
  });
  forwardDist.set(initialKey, 0);

  for (const stack of concreteTargets) {
    const key = encodeStack(stack);
    if (backwardDist.has(key)) continue;
    backwardDist.set(key, 0);
    backwardBuckets[0]!.push({ stack, cost: 0, key });
  }

  let bestCost = Infinity;
  let meetKey = -1;
  let forwardQueued = 1;
  let backwardQueued = concreteTargets.length;

  const enqueueForward = (
    from: SearchNode,
    stack: readonly number[],
    cost: number,
    code: readonly CodeAtom[],
  ) => {
    if (stack.length > MaxSearchArity) return;
    const nextCost = from.cost + cost;
    if (nextCost >= bestCost || nextCost > MaxSearchCost) return;
    const key = encodeStack(stack);
    const prev = forwardDist.get(key);
    if (prev !== undefined && prev <= nextCost) return;
    forwardDist.set(key, nextCost);
    forwardParent.set(key, [from.key, code]);
    forwardBuckets[nextCost]!.push({
      stack,
      cost: nextCost,
      key,
    });
    ++forwardQueued;
    const backwardCost = backwardDist.get(key);
    if (backwardCost !== undefined && nextCost + backwardCost < bestCost) {
      bestCost = nextCost + backwardCost;
      meetKey = key;
    }
  }

  const enqueueBackward = (
    from: SearchNode,
    stack: readonly number[],
    cost: number,
    code: readonly CodeAtom[],
  ) => {
    if (stack.length > MaxSearchArity) return;
    const nextCost = from.cost + cost;
    if (nextCost >= bestCost || nextCost > MaxSearchCost) return;
    const key = encodeStack(stack);
    const prev = backwardDist.get(key);
    if (prev !== undefined && prev <= nextCost) return;
    backwardDist.set(key, nextCost);
    backwardParent.set(key, [from.key, code]);
    backwardBuckets[nextCost]!.push({
      stack,
      cost: nextCost,
      key,
    });
    ++backwardQueued;
    const forwardCost = forwardDist.get(key);
    if (forwardCost !== undefined && forwardCost + nextCost < bestCost) {
      bestCost = forwardCost + nextCost;
      meetKey = key;
    }
  }

  const expandForward = (node: SearchNode) => {
    for (let i = 0; i < exprs.length; ++i) {
      const symbol = -i - 1;
      if (!node.stack.includes(symbol))
        enqueueForward(node, [...node.stack, symbol], 1, exprs[i]!.code);
    }

    if (blankCount && countSymbol(node.stack, 0) < maxCount(0))
      enqueueForward(node, [...node.stack, 0], 2, [Op.PUSH0]);

    const len = node.stack.length;
    if (len) {
      const top = node.stack[len - 1]!;
      const requiredCount = required.get(top) ?? 0;
      if (!isExpr(top) && countSymbol(node.stack, top) > requiredCount)
        enqueueForward(node, node.stack.slice(0, -1), 2, [Op.POP]);
    }

    if (len < MaxSearchArity)
      for (let n = 1; n <= Math.min(16, len); ++n) {
        const symbol = node.stack[len - n]!;
        if (!isExpr(symbol) && symbol != 0 &&
          countSymbol(node.stack, symbol) < maxCount(symbol))
          enqueueForward(node, [...node.stack, symbol], 3, [DUPN(n)]);
      }

    for (let n = 1; n <= Math.min(16, len - 1); ++n) {
      const topIndex = len - 1;
      const swapIndex = topIndex - n;
      if (node.stack[topIndex] == node.stack[swapIndex]) continue;
      const stack = [...node.stack];
      [stack[topIndex], stack[swapIndex]] = [stack[swapIndex]!, stack[topIndex]!];
      enqueueForward(node, stack, 3, [SWAPN(n)]);
    }
  }

  const expandBackward = (node: SearchNode) => {
    const len = node.stack.length;
    if (!len) return;

    const top = node.stack[len - 1]!;
    if (isExpr(top))
      enqueueBackward(node, node.stack.slice(0, -1), 1, exprs[-top - 1]!.code);
    if (top == 0)
      enqueueBackward(node, node.stack.slice(0, -1), 2, [Op.PUSH0]);

    for (let n = 1; n <= Math.min(16, len - 1); ++n)
      if (node.stack[len - 1 - n] == top)
        enqueueBackward(node, node.stack.slice(0, -1), 3, [DUPN(n)]);

    for (const symbol of blankSymbols) {
      const stack = [...node.stack, symbol];
      if (countSymbol(stack, symbol) <= maxCount(symbol) &&
        countSymbol(stack, symbol) > (required.get(symbol) ?? 0))
        enqueueBackward(node, stack, 2, [Op.POP]);
    }

    for (let n = 1; n <= Math.min(16, len - 1); ++n) {
      const topIndex = len - 1;
      const swapIndex = topIndex - n;
      if (node.stack[topIndex] == node.stack[swapIndex]) continue;
      const stack = [...node.stack];
      [stack[topIndex], stack[swapIndex]] = [stack[swapIndex]!, stack[topIndex]!];
      enqueueBackward(node, stack, 3, [SWAPN(n)]);
    }
  }

  let forwardCost = 0;
  let backwardCost = 0;
  let explored = 0;
  while ((forwardQueued || backwardQueued) &&
    explored < MaxSearchStates &&
    forwardCost + backwardCost < bestCost) {
    while (forwardCost <= MaxSearchCost && !forwardBuckets[forwardCost]!.length)
      ++forwardCost;
    while (backwardCost <= MaxSearchCost && !backwardBuckets[backwardCost]!.length)
      ++backwardCost;
    if (forwardCost > MaxSearchCost && backwardCost > MaxSearchCost)
      break;
    if (forwardCost + backwardCost >= bestCost)
      break;

    if (forwardCost <= backwardCost) {
      const node = forwardBuckets[forwardCost]!.pop()!;
      --forwardQueued;
      if (forwardDist.get(node.key) != node.cost) continue;
      if (goal(node.stack) && node.cost < bestCost) {
        bestCost = node.cost;
        meetKey = node.key;
      }
      ++explored;
      expandForward(node);
    } else {
      const node = backwardBuckets[backwardCost]!.pop()!;
      --backwardQueued;
      if (backwardDist.get(node.key) != node.cost) continue;
      ++explored;
      expandBackward(node);
    }
  }

  if (meetKey != -1) {
    const code: CodeAtom[][] = [];
    for (let key = meetKey; key != initialKey;) {
      const [prev, edge] = forwardParent.get(key)!;
      code.push([...edge]);
      key = prev;
    }
    code.reverse();
    for (let key = meetKey; backwardParent.has(key);) {
      const [next, edge] = backwardParent.get(key)!;
      code.push([...edge]);
      key = next;
    }
    return compose(new Fragment(expect, maxUse, f.expect, code.flat()), f);
  }

  return null;
}

const tryAppendTrimUse = (
  args: readonly (Fragment | StackRef | undefined)[],
  f: Fragment,
): Fragment | null => {
  if (!args.every((arg) =>
    !(arg instanceof StackRef) || arg.mode == StackRefMode.Use))
    return null;
  if (args.some((arg) => arg instanceof StackRef))
    return null;
  const maxUse = 0;

  const expect = Array<EvmType>(maxUse).fill(Word);
  const target: number[] = [];
  const exprs: Fragment[] = [];
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (arg === undefined) {
      assert(f.expect[i] == Word,
        `blank argument requires Word at position ${i + 1}`);
      target.push(0);
      continue;
    }
    if (arg instanceof Fragment) {
      target.push(-exprs.length - 1);
      exprs.push(arg);
      continue;
    }
    return null;
  }

  const code: CodeAtom[] = [];
  const appendTarget = target.length
    ? target.map((_, i) => target[(i + maxUse) % target.length]!)
    : target;
  for (let i = 0; i < appendTarget.length; ++i) {
    const symbol = appendTarget[i]!;
    if (symbol < 0)
      code.push(...exprs[-symbol - 1]!.code);
    else if (symbol == 0)
      code.push(Op.PUSH0);
    else {
      const n = symbol + i;
      if (n > 16) return null;
      code.push(DUPN(n));
    }
  }
  if (maxUse) {
    if (target.length > 16) return null;
    for (let i = 0; i < maxUse; ++i)
      code.push(SWAPN(target.length), Op.POP);
  }
  return compose(new Fragment(expect, maxUse, f.expect, code), f);
}

const tryAllDup = (
  args: readonly (Fragment | StackRef | undefined)[],
  f: Fragment,
): Fragment | null => {
  if (!args.every((arg) =>
    !(arg instanceof StackRef) || arg.mode == StackRefMode.Dup))
    return null;
  if (args.some((arg) => arg instanceof StackRef))
    return null;

  const frags: Fragment[] = [];
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (arg === undefined) {
      assert(f.expect[i] == Word,
        `blank argument requires Word at position ${i + 1}`);
      frags.push(Ops[Op.PUSH0]!);
    } else if (arg instanceof Fragment)
      frags.push(arg);
    else return null;
  }
  return compose(...frags, f);
}

const bind = (args: readonly BindArg[], f: Fragment): Fragment => {
  if (args.length != f.expect.length)
    throw new TypeError(
      `bind expected ${f.expect.length} arguments, received ${args.length}`);
  const materialized = Array.from(args, (arg, i) =>
    materializeArg(arg, i, f.expect[i]));
  for (const arg of materialized)
    if (arg instanceof StackRef)
      throw new TypeError("named stack refs are not implemented yet");
  const outF = tryAllUse(materialized, f) ??
    tryAppendTrimUse(materialized, f) ??
    tryAllDup(materialized, f);
  if (!outF)
    throw new TypeError("unsupported bind pattern");
  return outF;
}

export { bind, BindArg };

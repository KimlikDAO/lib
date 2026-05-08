import { ExprChild, Expression, StackRef } from "./expression";
import { CodeAtom, Fragment } from "./fragment";
import { DUPN, Op, SWAPN } from "./opcodes";
import { Signature } from "./signature";
import {
  ActionId,
  BLANK_ACTION,
  POP_ACTION,
  Path,
  SearchAction,
  SearchProblem,
  SearchState,
  ValueId,
  dupIndex,
  swapIndex,
} from "./solver/types";
import { EvmType, Word } from "./types";

type SearchSetup = SearchProblem & {
  readonly fragsByActionId: ReadonlyMap<ActionId, Fragment>;
  readonly idsByName: ReadonlyMap<string, ValueId>;
  readonly idsByExpr: ReadonlyMap<Expression, ValueId>;
  readonly typesById: ReadonlyMap<ValueId, EvmType>;
};

const collectNames = (expr: Expression): Set<string> => {
  const names = new Set<string>();
  const walk = (expr: Expression) => {
    for (const child of expr.children)
      if (child instanceof StackRef)
        names.add(child.name);
      else
        walk(child);
  }
  walk(expr);
  return names;
}

const prepareSearch = (
  prefix: Signature,
  expr: Expression,
  keep: Set<string>,
): SearchSetup => {
  const names = collectNames(expr);
  for (const name of keep) names.add(name);

  const prefixNames = prefixNameInfo(prefix);
  const depthByName = new Map<string, ValueId>();
  const typeByName = new Map<string, EvmType>();
  for (const name of names) {
    const { depth, type } = resolveName(prefixNames, name);
    depthByName.set(name, depth);
    typeByName.set(name, type);
  }

  const depths = [...new Set(depthByName.values())].sort((a, b) => b - a);
  const deepest = depths[0] ?? 0;
  const idsByDepth = new Map<ValueId, ValueId>();
  depths.forEach((depth, i) => idsByDepth.set(depth, i - depths.length));

  const idsByName = new Map<string, ValueId>();
  const typesById = new Map<ValueId, EvmType>();
  for (const [name, depth] of depthByName) {
    const id = idsByDepth.get(depth)!;
    idsByName.set(name, id);
    typesById.set(id, typeByName.get(name)!);
  }

  const initialStack = Array.from({ length: deepest }, (_, i) =>
    idsByDepth.get(deepest - i) ?? 0);
  const keepIds = [...new Set([...keep]
    .map((name) => resolveName(idsByName, name)))]
    .sort((a, b) => a - b);

  let nextId = 1;
  const actionIds: ActionId[] = [];
  const actionsById = new Map<ActionId, SearchAction>();
  const fragsByActionId = new Map<ActionId, Fragment>();
  const idsByExpr = new Map<Expression, ValueId>();

  const buildExpression = (expr: Expression): ValueId => {
    if (expr.ensure.length != 1)
      throw new TypeError(
        "binder currently supports only single-output expression nodes");
    const output = nextId++;
    const inputs = expr.children.map(buildChild);
    idsByExpr.set(expr, output);
    typesById.set(output, expr.ensure[0]!);
    actionsById.set(output, { id: output, inputs, output });
    fragsByActionId.set(output, expr.frag);
    actionIds.push(output);
    return output;
  }

  const buildChild = (child: ExprChild): ValueId =>
    child instanceof StackRef
      ? resolveName(idsByName, child.name)
      : buildExpression(child);

  const output = buildExpression(expr);
  const goal = ({ stack, actions }: SearchState): boolean =>
    actions.length == 0
    && keepIds.every((id) => stack.includes(id))
    && stack[stack.length - 1] == output;

  return {
    initial: { stack: initialStack, actions: actionIds },
    keep: keepIds,
    output,
    actionsById,
    fragsByActionId,
    idsByName,
    idsByExpr,
    typesById,
    goal,
  };
}

const prefixNameInfo = (
  prefix: Signature,
): ReadonlyMap<string, { depth: ValueId; type: EvmType }> => {
  const names = new Map<string, { depth: ValueId; type: EvmType }>();
  const { ensureNames } = prefix;
  for (let i = ensureNames.length - 1; 0 <= i; --i) {
    const name = ensureNames[i];
    if (name && !names.has(name))
      names.set(name, {
        depth: ensureNames.length - i,
        type: prefix.ensure[i]!,
      });
  }
  return names;
}

const resolveName = <T>(
  idsByName: ReadonlyMap<string, T>,
  name: string,
): T => {
  const value = idsByName.get(name);
  if (value === undefined)
    throw new ReferenceError(`unknown stack name ${name}`);
  return value;
}

const bind = (
  prefix: Signature,
  expr: Expression,
  keep: Set<string>
): Fragment => {
  const setup = prepareSearch(prefix, expr, keep);
  if (keepsAllParticipatingValues(setup))
    return emitDupPostorder(setup, expr);
  throw new TypeError("bind search is not implemented yet");
}

const fragmentFromPath = (setup: SearchSetup, path: Path): Fragment => {
  const code: CodeAtom[] = [];
  for (const actionId of path.actions)
    appendActionCode(setup, actionId, code);
  const prefixLength = commonPrefixLength(path.start.stack, path.end.stack);
  const ensure = path.end.stack.slice(prefixLength);

  return Fragment.from({
    expect: path.start.stack.map((id) => typeOfId(setup, id)),
    pop: path.start.stack.length - prefixLength,
    ensure: ensure.map((id) => typeOfId(setup, id)),
    ensureNames: ensureNamesFor(setup, ensure),
    code,
  });
}

const emitDupPostorder = (
  setup: SearchSetup,
  expr: Expression,
): Fragment => {
  const stack = [...setup.initial.stack];
  const code: CodeAtom[] = [];
  const expect = stack.map((id) =>
    id ? setup.typesById.get(id)! : Word);
  const drop = Math.max(0, maxDupDepth(setup, expr) - 16);
  if (drop) {
    const trailingZeros = countTrailingZeros(stack);
    if (trailingZeros < drop)
      throw new RangeError(
        `cannot bring deepest stack value into DUP16: need ${drop}`
        + ` trailing junk slots, found ${trailingZeros}`);
    for (let i = 0; i < drop; ++i) {
      code.push(Op.POP);
      stack.pop();
    }
  }

  const emit = (expr: Expression) => {
    const { pop } = expr.frag.signature;
    for (const child of expr.children) {
      if (child instanceof StackRef) {
        const id = resolveName(setup.idsByName, child.name);
        const index = stack.lastIndexOf(id);
        if (index == -1)
          throw new ReferenceError(`stack name ${child.name} is unavailable`);
        code.push(DUPN(stack.length - index));
        stack.push(id);
      } else {
        emit(child);
      }
    }
    code.push(...expr.frag.code);
    stack.length -= pop;
    stack.push(resolveExprId(setup, expr));
  }

  emit(expr);
  return Fragment.from({ expect, pop: drop, ensure: expr.ensure, code });
}

const appendActionCode = (
  setup: SearchSetup,
  actionId: ActionId,
  code: CodeAtom[],
) => {
  if (actionId == BLANK_ACTION) {
    code.push(Op.PUSH0);
    return;
  }

  if (actionId == POP_ACTION) {
    code.push(Op.POP);
    return;
  }

  const swap = swapIndex(actionId);
  if (swap) {
    code.push(SWAPN(swap));
    return;
  }

  const dup = dupIndex(actionId);
  if (dup) {
    code.push(DUPN(dup));
    return;
  }

  const frag = setup.fragsByActionId.get(actionId);
  if (!frag)
    throw new ReferenceError(`unknown path action ${actionId}`);
  code.push(...frag.code);
}

const maxDupDepth = (setup: SearchSetup, expr: Expression): number => {
  const stack = [...setup.initial.stack];
  let max = 0;

  const walk = (expr: Expression) => {
    const { pop } = expr.frag.signature;
    for (const child of expr.children) {
      if (child instanceof StackRef) {
        const id = resolveName(setup.idsByName, child.name);
        const index = stack.lastIndexOf(id);
        if (index == -1)
          throw new ReferenceError(`stack name ${child.name} is unavailable`);
        const depth = stack.length - index;
        max = Math.max(max, depth);
        stack.push(id);
      } else {
        walk(child);
      }
    }
    stack.length -= pop;
    stack.push(resolveExprId(setup, expr));
  }

  walk(expr);
  return max;
}

const resolveExprId = (
  setup: SearchSetup,
  expr: Expression,
): ValueId => {
  const id = setup.idsByExpr.get(expr);
  if (id === undefined)
    throw new ReferenceError("unknown expression node");
  return id;
}

const countTrailingZeros = (stack: readonly ValueId[]): number => {
  let count = 0;
  for (let i = stack.length - 1; 0 <= i && stack[i] == 0; --i)
    ++count;
  return count;
}

const commonPrefixLength = (
  a: readonly ValueId[],
  b: readonly ValueId[],
): number => {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] == b[i]) ++i;
  return i;
}

const typeOfId = (setup: SearchSetup, id: ValueId): EvmType => {
  if (id == 0) return Word;
  const type = setup.typesById.get(id);
  if (!type)
    throw new ReferenceError(`unknown value id ${id}`);
  return type;
}

const ensureNamesFor = (
  setup: SearchSetup,
  stack: readonly ValueId[],
): (string | undefined)[] => {
  const keep = new Set(setup.keep);
  const namesById = new Map<ValueId, string>();
  for (const [name, id] of setup.idsByName)
    if (keep.has(id) && !namesById.has(id))
      namesById.set(id, name);
  return stack.map((id) => namesById.get(id));
}

const keepsAllParticipatingValues = ({ keep }: SearchSetup): boolean =>
  keep.length == 0
  || (keep[0] == -keep.length && keep[keep.length - 1] == -1);

export {
  bind,
  collectNames,
  emitDupPostorder,
  fragmentFromPath,
  keepsAllParticipatingValues,
  prepareSearch
};

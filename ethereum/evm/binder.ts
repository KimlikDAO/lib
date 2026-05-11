import { ExprChild, Expression, StackRef } from "./expression";
import { CodeAtom, Fragment } from "./fragment";
import { DUPN, Op, SWAPN } from "./opcodes";
import { Signature } from "./signature";
import {
  BLANK_ACTION,
  POP_ACTION,
  dupIndex,
  swapIndex,
} from "./solver/action";
import { solve } from "./solver/solver";
import {
  ActionId,
  Problem,
  RuleInputs,
  Solution,
  ValueId,
} from "./solver/solver.d";
import { EvmType, Word } from "./types";

class BoundProblem implements Problem {
  constructor(
    readonly init: ValueId[],
    readonly keep: ValueId[],
    readonly output: ValueId,
    readonly rules: RuleInputs[],
    readonly fragsByActionId: ReadonlyMap<ActionId, Fragment>,
    readonly idsByName: ReadonlyMap<string, ValueId>,
    readonly typesById: ReadonlyMap<ValueId, EvmType>,
  ) { }
}

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

const createProblem = (
  prefix: Signature,
  expr: Expression,
  keep: Set<string>,
): BoundProblem => {
  const names = collectNames(expr);
  const prefixNames = prefixNameInfo(prefix);
  for (const name of keep)
    if (prefixNames.has(name))
      names.add(name);

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
    .map((name) => idsByName.get(name))
    .filter((id): id is ValueId => id !== undefined))]
    .sort((a, b) => a - b);

  let nextId = 1;
  const rules: ActionId[][] = [[]];
  const fragsByActionId = new Map<ActionId, Fragment>();

  const buildExpression = (expr: Expression): ValueId => {
    if (expr.ensure.length != 1)
      throw new TypeError(
        "binder currently supports only single-output expression nodes");
    const output = nextId++;
    const inputs = expr.children.map(buildChild);
    typesById.set(output, expr.ensure[0]!);
    rules[output] = inputs;
    fragsByActionId.set(output, expr.frag);
    return output;
  }

  const buildChild = (child: ExprChild): ValueId =>
    child instanceof StackRef
      ? resolveName(idsByName, child.name)
      : buildExpression(child);

  const output = buildExpression(expr);
  return new BoundProblem(
    initialStack,
    keepIds,
    output,
    rules,
    fragsByActionId,
    idsByName,
    typesById,
  );
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
  const problem = createProblem(prefix, expr, keep);
  const path = solve(problem);
  return fragmentFromPath(problem, path);
}

const fragmentFromPath = (problem: BoundProblem, path: Solution): Fragment => {
  const code: CodeAtom[] = [];
  for (const actionId of path.actions)
    appendActionCode(problem, actionId, code);
  const pop = Math.max(path.beg.length - path.end.length + 1, 0);
  const ensure = path.end.slice(path.beg.length - pop);

  return Fragment.from({
    expect: path.beg.map((id) => typeOfId(problem, id)),
    pop,
    ensure: ensure.map((id) => typeOfId(problem, id)),
    ensureNames: ensureNamesFor(problem, ensure),
    code,
  });
}

const appendActionCode = (
  problem: BoundProblem,
  actionId: ActionId,
  code: CodeAtom[],
) => {
  if (actionId == BLANK_ACTION)
    code.push(Op.PUSH0);
  else if (actionId == POP_ACTION)
    code.push(Op.POP);
  else {
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
    const frag = problem.fragsByActionId.get(actionId);
    if (!frag)
      throw new ReferenceError(`unknown path action ${actionId}`);
    code.push(...frag.code);
  }
}

const typeOfId = (problem: BoundProblem, id: ValueId): EvmType => {
  if (id == 0) return Word;
  const type = problem.typesById.get(id);
  if (!type)
    throw new ReferenceError(`unknown value id ${id}`);
  return type;
}

const ensureNamesFor = (
  problem: BoundProblem,
  stack: readonly ValueId[],
): (string | undefined)[] => {
  const keep = new Set(problem.keep);
  const namesById = new Map<ValueId, string>();
  for (const [name, id] of problem.idsByName)
    if (keep.has(id) && !namesById.has(id))
      namesById.set(id, name);
  return stack.map((id) => namesById.get(id));
}

export {
  BoundProblem,
  bind,
  collectNames,
  createProblem,
  fragmentFromPath
};

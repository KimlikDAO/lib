import { Expression, StackRef } from "./expression";
import type { ExprChild } from "./expression";
import { Fragment } from "./fragment";
import { Signature } from "./signature";
import { SetStatement } from "./statement";
import type { Statement } from "./statement";

type StackValue = number;

type SearchAction = {
  readonly id: StackValue;
  readonly inputs: readonly StackValue[];
  readonly outputs: readonly StackValue[];
  readonly expr: Expression;
};

type SearchState = {
  readonly stack: readonly StackValue[];
  readonly actions: readonly SearchAction[];
};

type SearchSetup = {
  readonly initial: SearchState;
  readonly keep: readonly StackValue[];
  readonly outputs: readonly StackValue[];
  readonly idsByName: ReadonlyMap<string, StackValue>;
  readonly goal: (state: SearchState) => boolean;
};

const collectNames = (stmt: Statement | ExprChild): Set<string> => {
  const names = new Set<string>();
  collectInto(stmt, names);
  return names;
}

const collectInto = (stmt: Statement | ExprChild, names: Set<string>) => {
  if (stmt instanceof StackRef) {
    names.add(stmt.name);
  } else if (stmt instanceof Expression) {
    for (const child of stmt.children)
      collectInto(child, names);
  } else if (stmt instanceof SetStatement) {
    collectInto(stmt.init, names);
  }
}

const prepareSearch = (
  prefix: Signature,
  stmt: Statement,
  keep: Set<string>,
): SearchSetup => {
  const names = collectNames(stmt);
  for (const name of keep) names.add(name);

  const idsByName = prefixNameIds(prefix);
  let deepest = 0;
  for (const name of names)
    deepest = Math.max(deepest, resolveName(idsByName, name));

  const initialStack = Array.from(
    { length: deepest },
    (_, i) => deepest - i,
  );
  const keepIds = [...keep].map((name) => resolveName(idsByName, name));

  let nextId = -1;
  const actions: SearchAction[] = [];

  const alloc = (count: number): StackValue[] =>
    Array.from({ length: count }, () => nextId--);

  const buildExpression = (expr: Expression): StackValue[] => {
    const outputs = alloc(expr.ensure.length);
    const id = outputs[0] ?? nextId--;
    const inputs = expr.children.flatMap(buildChild);
    actions.push({ id, inputs, outputs, expr });
    return outputs;
  }

  const buildChild = (child: ExprChild): StackValue[] =>
    child instanceof StackRef
      ? [resolveName(idsByName, child.name)]
      : buildExpression(child);

  const root = statementInit(stmt);
  const outputs = root ? buildChild(root) : [];
  const goal = ({ stack, actions: remaining }: SearchState): boolean =>
    remaining.length == 0
    && keepIds.every((id) => stack.includes(id))
    && endsWith(stack, outputs);

  return {
    initial: { stack: initialStack, actions },
    keep: keepIds,
    outputs,
    idsByName,
    goal,
  };
}

const prefixNameIds = (prefix: Signature): ReadonlyMap<string, StackValue> => {
  const ids = new Map<string, StackValue>();
  const { ensureNames } = prefix;
  for (let i = ensureNames.length - 1; 0 <= i; --i) {
    const name = ensureNames[i];
    if (name && !ids.has(name))
      ids.set(name, ensureNames.length - i);
  }
  return ids;
}

const resolveName = (
  idsByName: ReadonlyMap<string, StackValue>,
  name: string,
): StackValue => {
  const id = idsByName.get(name);
  if (id === undefined)
    throw new ReferenceError(`unknown stack name ${name}`);
  return id;
}

const statementInit = (stmt: Statement): ExprChild | undefined =>
  stmt instanceof SetStatement ? stmt.init
    : stmt instanceof Expression ? stmt
      : undefined;

const endsWith = (
  stack: readonly StackValue[],
  suffix: readonly StackValue[],
): boolean =>
  suffix.length <= stack.length
  && suffix.every((id, i) => stack[stack.length - suffix.length + i] == id);

const bind = (
  prefix: Signature,
  stmt: Statement,
  keep: Set<string>
): Fragment => {
  prepareSearch(prefix, stmt, keep);
  return Fragment.from({});
}

export {
  SearchAction,
  SearchSetup,
  SearchState,
  StackValue,
  bind,
  collectNames,
  prepareSearch,
};

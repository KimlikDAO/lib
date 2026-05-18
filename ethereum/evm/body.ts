import { bind, collectNames } from "./binder";
import { ExprChild, Expression, StackRef } from "./expression";
import { Fragment, LabelPos, compose } from "./fragment";
import { Signature } from "./signature";
import { Blob, NameBinding, SetStatement, Statement } from "./statement";
import { EvmType, Word, assertAssignable } from "./types";
import { assert } from "./util/assert";

type Body = Statement | readonly Body[];

function body(...input: readonly Body[]): Fragment {
  const statements = flattenBody(input.length == 1 ? input[0]! : input);
  return bodyFrom(Fragment.from({}), statements);
}

const bodyFrom = (
  prefix: Fragment,
  body: Body,
  keepAtEnd = new Set<string>(),
): Fragment => {
  const statements = flattenBody(body);
  const keepAfter = futureRefs(statements, keepAtEnd);
  let frag = prefix;
  for (let i = 0; i < statements.length; ++i) {
    const stmt = statements[i]!;
    let next: Fragment;
    if (stmt instanceof Blob)
      next = Fragment.from({
        code: [new LabelPos(stmt.label.id), stmt.data],
      });
    else if (stmt instanceof SetStatement)
      next = bind(
        frag.signature,
        setExpr(stmt, frag.signature),
        bindKeep(stmt, keepAfter[i]!),
      );
    else if (stmt instanceof Expression)
      next = bind(frag.signature, statementExpr(stmt), keepAfter[i]!);
    else
      next = Fragment.from({ code: [new LabelPos(stmt.id)] });
    frag = eraseReboundName(compose(frag, next), stmt);
  }
  return frag;
}

const isBodyList = (body: Body): body is readonly Body[] =>
  Array.isArray(body);

const flattenBody = (body: Body): Statement[] =>
  isBodyList(body) ? body.flatMap(flattenBody) : [body];

const futureRefs = (
  statements: readonly Statement[],
  keepAtEnd = new Set<string>(),
): Set<string>[] => {
  const keepAfter = Array<Set<string>>(statements.length);
  const keep = new Set(keepAtEnd);
  for (let i = statements.length - 1; 0 <= i; --i) {
    keepAfter[i] = new Set(keep);
    for (const name of refsIn(statements[i]!))
      keep.add(name);
  }
  return keepAfter;
}

const refsIn = (stmt: Statement): Set<string> => {
  if (stmt instanceof SetStatement)
    return refsInChild(stmt.init);
  return stmt instanceof Expression ? collectNames(stmt) : new Set();
}

const refsInChild = (child: ExprChild): Set<string> =>
  child instanceof StackRef ? new Set([child.name]) : collectNames(child);

const bindKeep = (
  stmt: SetStatement,
  keep: Set<string>,
): Set<string> => {
  if (!(stmt.name instanceof StackRef) || !keep.has(stmt.name.name))
    return keep;
  const out = new Set(keep);
  out.delete(stmt.name.name);
  return out;
}

const eraseReboundName = (frag: Fragment, stmt: Statement): Fragment =>
  stmt instanceof SetStatement && stmt.name instanceof StackRef
    ? keepLastName(frag, stmt.name.name)
    : frag;

const keepLastName = (frag: Fragment, name: string): Fragment => {
  const { ensure, ensureNames } = frag.signature;
  const names = [...ensureNames];
  let found = false;
  let changed = false;
  for (let i = names.length - 1; 0 <= i; --i)
    if (names[i] == name) {
      if (!found)
        found = true;
      else {
        names[i] = undefined;
        changed = true;
      }
    }
  return changed
    ? compose(frag, Fragment.from({
      expect: ensure,
      pop: ensure.length,
      ensure,
      ensureNames: names,
    }))
    : frag;
}

const setExpr = (stmt: SetStatement, prefix: Signature): Expression => {
  const init = stmt.init instanceof StackRef
    ? stackRefExpr(stmt.init, stmt.name, prefix)
    : stmt.init;
  return withEnsureNames(init, namesFor(stmt.name, init.frag.signature));
}

const eraseNames = (expr: Expression): Expression =>
  withEnsureNames(expr, Array(expr.ensure.length).fill(undefined));

const statementExpr = (expr: Expression): Expression => {
  if (expr.ensure.length <= 1)
    return eraseNames(expr);
  throw new TypeError(
    `Expression statement expected at most one output, received`
    + ` ${expr.ensure.length}`);
}

const stackRefExpr = (
  ref: StackRef,
  name: NameBinding,
  prefix: Signature,
): Expression => {
  const type = typeOfRef(prefix, ref.name);
  return new Expression([ref], Fragment.from({
    expect: [type],
    pop: 1,
    ensure: [type],
    ensureNames: namesFor(name, new Signature([], 0, [type])),
  }));
}

const namesFor = (
  binding: NameBinding,
  signature: Signature,
): (string | undefined)[] => {
  const { ensure, ensureNames } = signature;
  if (typeof binding == "string") {
    assert(ensure.length == 1,
      `set name expects one output, received ${ensure.length}`);
    return [binding];
  }
  if (binding instanceof StackRef) {
    assert(ensure.length == 1,
      `set name expects one output, received ${ensure.length}`);
    if (binding.type)
      assertAssignable(binding.type, ensure[0]!,
        `set ${binding.name}`);
    return [binding.name];
  }
  if (Array.isArray(binding)) {
    assert(binding.length == ensure.length,
      `set name count ${binding.length} does not match output count`
      + ` ${ensure.length}`);
    return [...binding];
  }
  return ensureNames.map((name) => name ? binding[name] ?? name : undefined);
}

const withEnsureNames = (
  expr: Expression,
  ensureNames: readonly (string | undefined)[],
): Expression => {
  const { expect, pop, ensure, halt } = expr.frag.signature;
  return new Expression(expr.children, Fragment.from({
    expect,
    pop,
    ensure,
    ensureNames,
    halt,
    code: expr.frag.code,
  }));
}

const typeOfRef = (prefix: Signature, name: string): EvmType => {
  const { ensure, ensureNames } = prefix;
  for (let i = ensureNames.length - 1; 0 <= i; --i)
    if (ensureNames[i] == name)
      return ensure[i]!;
  return Word;
}

export { body, bodyFrom, flattenBody };
export type { Body };

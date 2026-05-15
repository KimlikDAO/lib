import { bind, collectNames } from "./binder";
import { ExprChild, Expression, StackRef } from "./expression";
import { Fragment, LabelPos, compose } from "./fragment";
import { Signature } from "./signature";
import { Blob, NameBinding, SetStatement, Statement } from "./statement";
import { EvmType, Word } from "./types";
import { assert } from "./util/assert";

type Body = Statement | readonly Body[];

function scope(body: Body): Fragment;
function scope(...body: readonly Body[]): Fragment;
function scope(...input: readonly Body[]): Fragment {
  const statements = flattenBody(input.length == 1 ? input[0]! : input);
  return scopeFrom(Fragment.from({}), statements);
}

const scopeFrom = (
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
      next = bind(frag.signature, setExpr(stmt, frag.signature), keepAfter[i]!);
    else if (stmt instanceof Expression)
      next = bind(frag.signature, statementExpr(stmt), keepAfter[i]!);
    else
      next = Fragment.from({ code: [new LabelPos(stmt.id)] });
    frag = compose(frag, next);
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

export { flattenBody, scope, scopeFrom };
export type { Body };

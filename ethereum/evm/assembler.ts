import { CodeAtom, FlatCode, Fragment, LabelPos, LabelRef } from "./fragment";
import { Op, PUSHN } from "./opcodes";
import { scope } from "./scope";
import { Label, Statement } from "./statement";
import { assert } from "./util";

type Program = Uint8Array<ArrayBuffer>;

interface Layout {
  readonly length: number;
  readonly labels: ReadonlyMap<number, number>;
}

type AssemblyInput = Fragment | Statement | readonly Statement[];

const layout = (code: FlatCode): Layout => {
  while (true) {
    let offset = 0;
    const labels = new Map<number, number>();
    for (const token of code) {
      if (typeof token == "number") {
        ++offset;
        continue;
      }
      if (token instanceof Uint8Array) {
        offset += token.length;
        continue;
      }
      if (token instanceof LabelPos) {
        assert(!labels.has(token.labelId),
          `${labelName(token.labelId)} was placed more than once`);
        labels.set(token.labelId, offset);
        continue;
      }
      offset += token.serializedLength;
    }

    let changed = false;
    for (const token of code) {
      if (!(token instanceof LabelRef)) continue;
      const target = labels.get(token.labelId);
      if (target === undefined)
        throw new Error(`${labelName(token.labelId)} was referenced but never placed`);
      const serializedLength = encodePushNumber(target).length;
      if (token.serializedLength != serializedLength
        || token.absoluteAddress != target) {
        token.serializedLength = serializedLength;
        token.absoluteAddress = target;
        changed = true;
      }
    }
    if (!changed)
      return { length: offset, labels };
  }
}

function assemble(fragment: Fragment): Program;
function assemble(...stmts: readonly (Statement | readonly Statement[])[]): Program;
function assemble(...input: readonly AssemblyInput[]): Program {
  const fragment = input.length == 1 && input[0] instanceof Fragment
    ? input[0]
    : scope(flattenStatements(input as readonly (Statement | readonly Statement[])[]));
  assert(fragment.signature.expect.length == 0,
    `Can only assemble fulfilled fragments, received `
    + `${fragment.signature.expect.length} expected stack values`);
  const { length } = layout(fragment.code);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const token of fragment.code)
    offset = writeToken(out, offset, token);
  validateJumps(fragment.code, out);
  return out;
}

const flattenStatements = (
  stmts: readonly (Statement | readonly Statement[])[],
): Statement[] => stmts.flatMap((stmt) =>
  Array.isArray(stmt) ? [...stmt] : [stmt]);

const writeToken = (
  out: Uint8Array,
  offset: number,
  token: CodeAtom,
): number => {
  if (typeof token == "number") {
    out[offset] = token;
    return offset + 1;
  }
  if (token instanceof Uint8Array) {
    out.set(token, offset);
    return offset + token.length;
  }
  if (token instanceof LabelPos)
    return offset;

  const encoded = encodePushNumber(token.absoluteAddress);
  assert(encoded.length == token.serializedLength,
    `${labelName(token.labelId)} changed size during serialization`);
  out.set(encoded, offset);
  return offset + encoded.length;
}

const validateJumps = (code: FlatCode, out: Program) => {
  for (const token of code) {
    if (!(token instanceof LabelRef) || !token.jump) continue;
    assert(out[token.absoluteAddress] == Op.JUMPDEST,
      `${labelName(token.labelId)} is used as a jump target`
      + ` but does not point to a JUMPDEST`);
  }
}

const encodePushNumber = (n: number): Program => {
  assert(Number.isSafeInteger(n) && 0 <= n,
    `Cannot encode negative or unsafe address ${n}`);
  if (n == 0)
    return Uint8Array.from([Op.PUSH0]);
  let hex = n.toString(16);
  if (hex.length & 1) hex = "0" + hex;
  const bytes = Uint8Array.fromHex(hex);
  assert(bytes.length <= 32, `Address ${n} exceeds 32 bytes`);
  const out = new Uint8Array(bytes.length + 1);
  out[0] = PUSHN(bytes.length);
  out.set(bytes, 1);
  return out;
}

const labelName = (labelId: number): string =>
  Label.names[labelId] ? `label "${Label.names[labelId]}"` : "anonymous label";

export { assemble, Program };

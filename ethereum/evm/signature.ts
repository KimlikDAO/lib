import {
  Addr,
  Bool,
  Data,
  EvmType,
  Locn,
  Size,
  Uint,
  Weis,
  Word,
  isAssignable,
  narrowType,
} from "./types";
import { assert } from "./util";

const HaltStates = ["⊣", "⊥", "⊤", "⊢"] as const;
type TypeList = readonly EvmType[];
type EnsureNames = readonly (string | undefined)[];
type HaltState = (typeof HaltStates)[number] | undefined;

class Signature {
  constructor(
    readonly expect: TypeList,
    readonly pop: number,
    readonly ensure: TypeList,
    readonly ensureNames: EnsureNames = Array(ensure.length).fill(undefined),
    readonly halt?: HaltState,
  ) {
    assert(Number.isInteger(pop),
      `Signature pop must be an integer, received ${pop}`);
    assert(-1 <= pop,
      `Signature pop must be -1 or non-negative, received ${pop}`);
    assert(pop <= expect.length,
      `Signature pop ${pop} exceeds expect length ${expect.length}`);
    assert(ensure.length == ensureNames.length,
      `Signature ensureNames length ${ensureNames.length}`
      + ` does not match ensure length ${ensure.length}`);
  }

  toString(): string {
    const halt = this.halt
      ? this.ensure.length ? ", " + this.halt : this.halt
      : "";
    const pop = this.pop < 0 ? "*" : "" + this.pop;
    const expect = this.expect.map((type) => type.name).join(", ");
    const ensure = this.ensure.map((type, i) =>
      this.ensureNames[i] ? type.name
        ? `${this.ensureNames[i]}: ${type.name}` : this.ensureNames[i]
        : type.name
    ).join(", ");
    return `(${expect}) → ${pop}|${ensure}${halt}`;
  }
  static from(sig: string): Signature {
    return parseSignature(sig);
  }
}

const compose = (...sigs: Signature[]): Signature => {
  const { len, pop } = peek(sigs);
  const expect = Array<EvmType>(len).fill(Word);
  const ensure: EvmType[] = [];
  const ensureNames: (string | undefined)[] = [];
  let halt: HaltState | undefined;

  let pos = 0; // Position relative to tos.
  let poc = 0; // max pop so far. -pos <= poc <= pop

  const narrowWith = (list: TypeList) => {
    const n = list.length;
    const ns = poc + pos; // length of ensure
    const nx = len + pos; // length of expect
    for (let i = 1; i <= n; ++i)
      if (i <= ns)
        assert(isAssignable(list[n - i]!, ensure[ns - i]!),
          `fragment output at stack position ${i}`);
      else
        expect[nx - i] = narrowType(expect[nx - i]!, list[n - i]!,
          `conflicting expectation at stack position ${len - (nx - i)}`);
  }

  for (const sig of sigs) {
    if (halt) continue;
    narrowWith(sig.expect);
    pos -= sig.pop;
    ensure.length =
      ensureNames.length = Math.max(0, ensure.length - sig.pop);
    poc = Math.max(poc, -pos);
    ensure.push(...sig.ensure);
    ensureNames.push(...sig.ensureNames);
    pos += sig.ensure.length;
    halt = sig.halt;
  }
  return new Signature(expect, pop, ensure, ensureNames, halt);
}

const peek = (sigs: Signature[]) => {
  let pos = 0;
  let len = 0;
  let pop = 0;
  for (const sig of sigs) {
    len = Math.max(len, sig.expect.length - pos);
    pos -= sig.pop;
    pop = Math.max(pop, -pos);
    pos += sig.ensure.length;
    if (sig.halt) break;
  }
  return { len, pop };
}

const TypeByName = {
  "Addr": Addr,
  "Bool": Bool,
  "Data": Data,
  "Locn": Locn,
  "Size": Size,
  "Uint": Uint,
  "Weis": Weis,
  "Word": Word,
} satisfies Record<string, EvmType>;

const parseType = (text: string, context: string): EvmType => {
  const name = text.trim();
  if (!name || name == "Word") return Word;
  const type = TypeByName[name as keyof typeof TypeByName];
  if (type) return type;
  throw new TypeError(`${context}: unknown type ${name}`);
}

const parseExpect = (text: string): TypeList =>
  !text.trim() ? [] : text.split(",").map((part) =>
    parseType(part, "signature expect"));

const parseEnsure = (
  text: string,
): { ensure: EvmType[]; ensureNames: (string | undefined)[] } => {
  if (!text.trim()) return { ensure: [], ensureNames: [] };

  const ensure: EvmType[] = [];
  const ensureNames: (string | undefined)[] = [];
  for (const rawPart of text.split(",")) {
    const part = rawPart.trim();
    if (!part) {
      ensure.push(Word);
      ensureNames.push(undefined);
      continue;
    }

    const colon = part.indexOf(":");
    if (colon == -1) {
      const type = TypeByName[part as keyof typeof TypeByName];
      if (type) {
        ensure.push(type);
        ensureNames.push(undefined);
      } else {
        ensure.push(Word);
        ensureNames.push(part);
      }
      continue;
    }

    const name = part.slice(0, colon).trim();
    const type = parseType(part.slice(colon + 1), "signature ensure");
    if (!name)
      throw new TypeError("signature ensure: empty name");
    ensure.push(type);
    ensureNames.push(name);
  }
  return { ensure, ensureNames };
}

const parseEnsureAndHalt = (
  text: string,
): {
  ensure: EvmType[];
  ensureNames: (string | undefined)[];
  halt?: HaltState;
} => {
  const trimmed = text.trim();
  for (const halt of HaltStates) {
    if (trimmed == halt)
      return { ensure: [], ensureNames: [], halt };
    const suffix = `, ${halt}`;
    if (trimmed.endsWith(suffix)) {
      const { ensure, ensureNames } = parseEnsure(
        trimmed.slice(0, -suffix.length),
      );
      return { ensure, ensureNames, halt };
    }
  }
  return parseEnsure(trimmed);
}

const parseSignature = (text: string): Signature => {
  const match = text.match(/^\s*\((.*)\)\s*(?:->|→)\s*([0-9]+|\*)\|(.*)\s*$/);
  if (!match)
    throw new TypeError(`invalid signature: ${text}`);

  const [, expectText, popText, ensureText] = match;
  const expect = parseExpect(expectText!);
  const pop = popText == "*" ? -1 : +popText!;
  const { ensure, ensureNames, halt } = parseEnsureAndHalt(ensureText!);
  return new Signature(expect, pop, ensure, ensureNames, halt);
}

export {
  EnsureNames,
  HaltState,
  Signature,
  TypeList,
  compose,
};

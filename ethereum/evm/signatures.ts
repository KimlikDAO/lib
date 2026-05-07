import {
  Addr,
  Bool,
  Data,
  EvmType,
  Locn,
  Signature,
  Size,
  TypeList,
  Uint,
  Weis,
  Word,
} from "./types";

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

const Halts = ["⊣", "⊥", "⊤", "⊢"] as const;

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
  halt?: "⊣" | "⊥" | "⊤" | "⊢";
} => {
  const trimmed = text.trim();
  for (const halt of Halts) {
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

const signature = (text: string): Signature => {
  const match = text.match(/^\s*\((.*)\)\s*(?:->|→)\s*([0-9]+|\*)\|(.*)\s*$/);
  if (!match)
    throw new TypeError(`invalid signature: ${text}`);

  const [, expectText, popText, ensureText] = match;
  const expect = parseExpect(expectText!);
  const pop = popText == "*" ? -1 : +popText!;
  const { ensure, ensureNames, halt } = parseEnsureAndHalt(ensureText!);
  return new Signature(expect, ensure, pop, halt, ensureNames);
}

export { signature };

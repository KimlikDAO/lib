enum Modifier {
  Nullable = 1,
  Optional = 2,
  Readonly = 4,
  ClosureNamespace = 8,

  Override = 16,

  // A VariableDeclaration whose init should be moved to callsite.
  AlwaysInline = 1 << 7,
  NoInline = 1 << 8,

  ReadonlyArguments = 1 << 20,
  ReadonlyThis = 1 << 21,
  ReadonlyExternal = 1 << 22,
  NoMutableExternal = 1 << 23,
  ReturnsValue = 1 << 24,

  InPlace = ReadonlyThis | ReadonlyExternal,
  PureMethod = ReadonlyExternal | ReadonlyArguments | ReturnsValue,
  SideEffectFree = ReadonlyExternal | ReadonlyArguments,
  PureAlias = SideEffectFree | NoMutableExternal,
  Pure = PureAlias | ReturnsValue
}

const hasAll = (lhs: Modifier, rhs: Modifier): boolean => (lhs & rhs) == rhs;

const JsDocModifierMap: Record<string, Modifier | -1> = {
  "alwaysinline": Modifier.AlwaysInline,
  "satisfies": -1,
  "satisfies {InPlaceFn}": Modifier.InPlace,
  "satisfies {PureMethodFn}": Modifier.PureMethod,
  "satisfies {SideEffectFreeFn}": Modifier.SideEffectFree,
  "satisfies {PureAliasFn}": Modifier.PureAlias,
  "satisfies {PureFn}": Modifier.Pure,
};

const isWhitespace = (charCode: number): boolean => charCode <= 32;

const modifiersFromJsDoc = (jsDoc: string): number => {
  let modifiers = 0;
  const parts = jsDoc.split("@");

  for (let i = 1; i < parts.length; ++i) {
    const part = parts[i];
    let cursor = 0;
    while (cursor < part.length && !isWhitespace(part.charCodeAt(cursor)))
      ++cursor;
    if (!cursor) continue;

    const directive = part.slice(0, cursor);
    const rule = JsDocModifierMap[directive];
    if (rule == undefined) continue;
    if (rule != -1) {
      modifiers |= rule;
      continue;
    }

    while (cursor < part.length && isWhitespace(part.charCodeAt(cursor)))
      ++cursor;
    if (part.charCodeAt(cursor) != 123) continue;

    const bracedEnd = part.indexOf("}", cursor + 1);
    if (bracedEnd == -1) continue;

    const bracedRule =
      JsDocModifierMap[`${directive} ${part.slice(cursor, bracedEnd + 1)}`];
    if (bracedRule != undefined && bracedRule != -1)
      modifiers |= bracedRule;
  }

  return modifiers;
}

export { Modifier, modifiersFromJsDoc, hasAll };

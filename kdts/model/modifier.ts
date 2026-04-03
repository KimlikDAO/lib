enum Modifier {
  Nullable = 1,
  Optional = 2,
  Readonly = 4,
  ClosureNamespace = 8,

  Override = 16,

  // -- Optimization hints and directives -- //

  // A VariableDeclaration whose init should be move to callsite.
  AlwaysInline = 1 << 7,
  NoInline = 1 << 8,

  /**
   * No mutation of observable external state. It can still read mutable
   * external state or mutate external state that is not observable.
   * Example: {@link Math.random()}
   */
  NoSideEffects = 1 << 9,

  // Given the same input, always returns the same output.
  // Functionally, this means no reads of mutable external state.
  Deterministic = 1 << 10,
  Pure = 1 << 9 | 1 << 10,

  ModifiesArgumentsOnly = 1 << 11,
  ModifiesThisOnly = 1 << 12,
}

const ParseBracedModifier = -1;

const JsDocModifierMap: Record<string, Modifier | -1> = {
  "alwaysinline": Modifier.AlwaysInline,
  "modifies": ParseBracedModifier,
  "modifies {arguments}": Modifier.ModifiesArgumentsOnly,
  "modifies {this}": Modifier.ModifiesThisOnly,
  "noinline": Modifier.NoInline,
  "nosideeffects": Modifier.NoSideEffects,
  "pure": Modifier.Pure,
  "pureOrBreakMyCode": Modifier.Pure
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
    if (rule != ParseBracedModifier) {
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
    if (bracedRule != undefined && bracedRule != ParseBracedModifier)
      modifiers |= bracedRule;
  }

  return modifiers;
}

export { Modifier, modifiersFromJsDoc };

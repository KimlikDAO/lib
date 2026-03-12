enum Modifier {
  Nullable = 1,
  Optional = 2,
  Readonly = 4,

  // VariableDeclaration (with single declarator) whose
  // value can be provided through a compiler parameter.
  Define = 8,

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

  ModifiesParametersOnly = 1 << 11,
  ModifiesThisOnly = 1 << 12,
}

const modifiersFromJsDoc = (jsDoc: string): number => {
  let modifiers = 0;
  if (jsDoc.includes("@noinline")) modifiers |= Modifier.NoInline;
  if (jsDoc.includes("@nosideeffects")) modifiers |= Modifier.NoSideEffects;
  if (jsDoc.includes("@pure")) modifiers |= Modifier.Pure;
  if (jsDoc.includes("@noinline")) modifiers |= Modifier.NoInline;
  if (jsDoc.includes("@define")) modifiers |= Modifier.Define;
  return modifiers;
}

export { Modifier, modifiersFromJsDoc };

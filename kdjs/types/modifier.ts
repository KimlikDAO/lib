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
  AlwaysInline = 128,
  NoInline = 256,

  // No mutation of external state. It can still read mutable external state.
  // Example: `Math.random()`
  NoSideEffects = 512,

  // Given the same input, always returns the same output.
  // Functionally, this means no reads of mutable external state.
  Deterministic = 1024,
  Pure = 512 | 1024,
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

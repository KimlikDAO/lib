enum Modifier {
  Nullable = 1,
  Optional = 2,
  Readonly = 4,
  ClosureNamespace = 8,

  Override = 16,

  // A VariableDeclaration whose init should be moved to callsite.
  Inline = 1 << 7,
  InlineFriendly = 1 << 8,
  NoInline = 1 << 9,

  ReadonlyArguments = 1 << 20,
  ReadonlyThis = 1 << 21,
  ReadonlyExternal = 1 << 22,
  NoMutableExternal = ReadonlyExternal + (1 << 23),
  ReturnsFreshValue = 1 << 24,

  Deterministic = NoMutableExternal,
  SideEffectFree = ReadonlyArguments + ReadonlyThis + ReadonlyExternal,
  InPlace = ReadonlyThis + NoMutableExternal, // Can mutate arguments
  InPlaceRand = ReadonlyThis + ReadonlyExternal, // Can mutate arguments and depend mutable external state
  Method = ReadonlyArguments + Deterministic, // Can mutate this
  PureAlias = ReadonlyArguments + ReadonlyThis + Deterministic, // Can return aliased
  Pure = PureAlias + ReturnsFreshValue
}

const hasAll = (lhs: Modifier, rhs: Modifier): boolean => (lhs & rhs) == rhs;

export { Modifier, hasAll };

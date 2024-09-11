/** @enum {number} */
const BuildMode = {
  Dev: 0,
  Compiled: 1,
  Release: 2
};

/** @enum {number} */
const CompilerError = {
  UNSUPPORTED_INLINE: 1,
  NESTED_REPLACE: 2,
  INCORRECT_PHANTOM: 3
}

export {
  BuildMode,
  CompilerError
};

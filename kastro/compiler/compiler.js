/**
 * Dev: Try to do as little work as possible while providing the fundamental
 *      functionality of kastro such as component rendering, i18n, and updating
 *      the js defines. The rendered page should be visually identical to the
 *      Compiled version; anything else is a bug.
 *
 * Compiled: Produce the most optimized version of the app, while not making
 *      any assumptions on the freshness of the source. In this mode, we
 *      take a content hash of the dependencies of each targe to determine
 *      whether to rebuild the target or not.
 *
 * Release: Produce the most optimized version of the app, while assuming
 *      the source code does not change during the build process. With this
 *      assumption, we can memoize the built targets without checking if their
 *      dependencies have changed.
 *
 * @enum {number}
 */
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

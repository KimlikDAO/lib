
/**
 * `PureExpr` is a marker type to hint kdts that the expression has no side
 * effects and is deterministic when used as the parameter to the `satisfies`
 * operator.
 *
 * @example
 * ```ts
 * const x = f(123) satisfies PureExpr;
 * ```
 */
type PureExpr = any;

export { PureExpr };

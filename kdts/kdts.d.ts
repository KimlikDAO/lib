
/**
 * `PureExpr` is a marker type to hint kdts that the expression has no side
 * effects and is deterministic when used as the parameter to the `satisfies`
 * operator.
 *
 * @example
 * ```ts
 * import { PureExpr } from "@kimlikdao/kdts";
 *
 * const x = f(123) + g(h(x)) satisfies PureExpr;
 * ```
 * Now if x is determined to be unused, the entire expression
 * `f(123) + g(h(x))` will be eliminated, even if `f` `g` and `h` individually
 * cannot be determined to be pure.
 *
 * Further, even if `x` is used, the expression may be replaced by the
 * evaluated result.
 */
type PureExpr = any;

export { PureExpr };

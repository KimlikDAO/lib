/**
 * `PureExpr` is a marker type to hint kdjs that the expression has no side
 * effects and deterministic when used as the parameter to the `satisfies`
 * operator.
 *
 * @example
 * ```ts
 * import { PureExpr } from "@kimlikdao/kdjs";
 *
 * const x = f(123) satisfies PureExpr;
 * ```
 */
type PureExpr = any;

export { PureExpr };

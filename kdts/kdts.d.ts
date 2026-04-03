
/**
 * `PureExpr` is a marker type to hint kdts that the expression has no side
 * effects and is deterministic when used as the parameter to the `satisfies`
 * operator.
 *
 * @example
 * ```ts
 * import { PureExpr } from "@kimlikdao/kdts";
 *
 * const x = 42;
 * const y = f(123) + g(h(x)) satisfies PureExpr;
 * ```
 * Now if `y` is determined to be unused, the entire expression
 * `f(123) + g(h(x))` will be eliminated, even if `f` `g` and `h` individually
 * cannot be determined to be pure.
 *
 * Further, even if `y` is used, the expression may be replaced by the
 * evaluated result.
 */
type PureExpr = any;

/**
 * `Overridable` marks a variable initializer whose default value may be
 * overridden by kdts during compilation.
 *
 * Use it with the `satisfies` operator when you want to keep a normal
 * in-source default value while still allowing build-specific values to be
 * provided by kdts.
 *
 * @example
 * ```ts
 * import { Overridable } from "@kimlikdao/kdts";
 *
 * const HOST_URL: string = "https://example.com" satisfies Overridable;
 * const ETAGS: Record<string, string> = {} satisfies Overridable;
 * ```
 * In this example, the file remains valid and runnable as written, but kdts
 * may override `HOST_URL` and `ETAGS` with values for a specific build.
 *
 * Override values may be supplied through `kdts --define`, through `globals`
 * passed by embedding tooling such as kastro, or by any other frontend that
 * integrates with kdts.
 *
 * The declared variable type remains authoritative. `Overridable` only marks
 * the initializer as eligible for override.
 */
type Overridable = any;

type LargeConstant = any;

export { LargeConstant, Overridable, PureExpr };

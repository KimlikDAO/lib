/**
 * `PureExpr` is a marker promising to kdts that the expression is side-effect
 * free and deterministic if annotated as `expr satisfies PureExpr`.
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
 * const HOST_URL = "https://example.com" satisfies Overridable;
 * const ETAGS: Record<string, string> = {} satisfies Overridable;
 * ```
 *
 * The declared variable type remains authoritative. `Overridable` only marks
 * the initializer as eligible for override.
 */
type Overridable = any;

type LargeConstant = any;

/**
 * A `FreshValue` is a primitive or an object with single reference containing
 * `FreshValue`s.
 *
 * @example
 * ```ts
 * [1, 2, 3]
 * { odd: [1n, 3n, 5n], even: [2n, 4n, 6n] }
 * { name: "John", age: 30 }
 * new Uint8Array([1, 2, 3])
 * ```
 * The following are not `FreshValue`s
 * ```ts
 * const name = "123";
 * { name, age: 30 } // has external reference to name
 * arr1.length > arr2.length ? arr1 : arr2 // arr_i are external references
 * ```
 */
type FreshValue = any;

declare global {
  /**
   * A function that mutates the provided arguments but cannot mutate any other
   * state that is not reachable from the provided arguments. Such functions
   * cannot depend on mutable external state and hence are deterministic.
   *
   * @example
   * ```ts
   * const writeInPlace = (bytes: Uint8Array, hex: string) =>
   *   bytes.setFromHex(hex);
   *
   * writeInPlace satisfies InPlaceFn;
   * ```
   */
  type InPlaceFn = Function;

  /**
   * A function that mutates the provided arguments but cannot mutate any other
   * state. Unlike {@link InPlaceFn}, can depend on external mutable state.
   */
  type InPlaceRandFn = Function;

  /**
   * A class method that can mutate only the instance state and nothing else.
   *
   * @example
   * ```ts
   * class Counter {
   *   c = 0;
   *   inc() { ++this.c; }
   * }
   * Counter.prototype.inc satisfies MethodFn;
   * ```
   */
  type MethodFn = Function;

  /**
   * A function that has no observable mutations to external state. Such
   * function can still read mutable external state.
   * @example
   * ```ts
   * Math.random satisfies SideEffectFreeFn;
   * ```
   */
  type SideEffectFreeFn = Function;

  /**
   * A function that is side-effect free and deterministic. Unlike a
   * {@link PureFn} the returned object may have external references.
   * 
   * @example
   * ```ts
   * const id = (x: unknown) => x;
   * 
   * id satisfies PureAliasFn;
   *
   * const longer = (a: number[], b: number[]): number[] => a.length > b.length
   *   ? a : b;
   *
   * longer satisfies PureAliasFn;
   * ```
   */
  type PureAliasFn = Function;

  /**
   * A function that is side-effect free, deterministic and that returns a
   * {@link FreshValue}. A `FreshValue` is a primitive or a freshly created
   * object containing `FreshValue`s.
   *
   * Calls to such functions can be replaced by the return value if the
   * parameters are known at compile time. They also admit all optimizations
   * available for {@link PureAliasFn}s and {@link SideEffectFreeFn}s.
   */
  type PureFn = Function;
}

export {
  FreshValue,
  LargeConstant,
  Overridable,
  PureExpr,
};

---
description: kdjs, our typescript / javascript compiler with advanced type aware optimizations
alwaysApply: true
---
kdjs is our ts/js compiler with advanced type-aware optimizations. TypeScript
has a strong type system which should be helpful with, among many things,
better code generation. With typical build pipelines today, it is unfortunate
that all type information is stripped away before even the bundler or minifier
can see it.

kdjs aims to improve on these pipelines: it is a bundler and optimizer which
fully leverages the type system. Currently, we rely on the Google Closure
Compiler as our backend, with a separate backend in the works.

In kdjs, both ts and js files are annotated via TypeScript type expressions:
- in ts files, at the standard annotation positions allowed by the syntax,
- in js files, inside jsdoc annotations.

We provide a seamless js/ts interoperability including the typing.
In kdjs, all types exist in the same space as runtime values. Eliminating
type marker objects from the compiled code is viewed as an optimization
consideration, not a language-level distinction. Removing type marker objects
is treated just like eliminating any other empty or vacuous objects and
values, which kdjs excels at.

In kjds, d.ts and .d.js files have a meaning consistent with but beyond ts:
every property in kdjs besides those types defined in .d.js or .d.ts file
is free to mangle. Properties of types defined in a .d.js and .d.ts files will
be preserved as is.

In kdjs classes and interfaces are nominal types whereas Object literal types
are structural. The situation is the same whether you define the type in js
or ts:

```ts
interface Person {
  name: string,
  age: number
}
```
or in js
```js
/** @interface */
class Person {
  /** @type {string} */
  name;
  /** @type {number} */
  age;
};
```

The following jsdoc annotations are added to the ts language:
@noinline, @nosideeffects, @pure and @define.

| Annotation        | Meaning                                                | Related Modifier Constant   |
|-------------------|--------------------------------------------------------|----------------------------|
| `@noinline`       | Prevents the function or variable from being inlined.  | `Modifier.NoInline`        |
| `@nosideeffects`  | Function does not mutate observable external state.    | `Modifier.NoSideEffects`   |
| `@pure`           | @nosideeffects plus the function is deterministic.     | `Modifier.Pure`            |
| `@define`         | Value can be overridden via a compiler parameter.      | `Modifier.Define`          |

Operationally, @nosideeffects means the function calls whose value is not
needed can be eliminated. Note that @nosideeffects functions can still
read mutable external state. For instance `Math.random()` is @nosideeffects.

Pure means the function is @nosideeffects and is determinisitic. Another
characterization is that the function does not read any external mutable state.
Operationally, one can do constant propagation through pure functions and
replace the function call with just a value if the parameters are compile time
constants and if this improves the code.

The definition of @nosideffects crucially includes "observable side effects".
Class private properties are considered unobservable. During release builds,
console is considered unobservable, which leads to elimination of all
console.log calls.

Additionally, we have certain marker types, the most notable of which is
`PureExpr`.

```ts
import { PureExpr } from "@kimlikdao/kjds";
// If `val` is not used, the entire expression will be eliminated
const val = g(f()) + h() satisfies PureExpr;
```

`PureExpr` is useful in situations where the compiler cannot automatically
determine that an expression is pure, allowing the author to provide this hint
explicitly.
# `kdts`: KimlikDAO JavaScript/TypeScript compiler

`kdts` is a JavaScript/TypeScript compiler with advanced optimization and minification.
It uses the Google Closure Compiler (GCC) in the main pipeline and adds custom optimization
passes and a more powerful module system (e.g. ES module `export` / unlinked `import` generation,
which GCC does not support on its own).

## TypeScript-first

`kdts` compiles **TypeScript** and is TS-focused. Your entry file can be `entry.ts` or `entry.js`;
imports are resolved with TypeScript preferred (`.ts` before `.js`). TypeScript sources are
transpiled to JS before being fed to the rest of the pipeline.

## JSDoc in JavaScript: TypeScript-style types

JavaScript files can still be fully typed via **JSDoc**, but `kdts` does *not* use
Google Closure–style type annotations. Those are very verbose (e.g. `{!Array<!Array<!User>>}`).
Instead, JSDoc uses **TypeScript-style type syntax** inside the `{ }`:

- `{User[][]}` instead of `{!Array<!Array<!User>>}`
- `{Map<string, number>}`, `{() => void}`, `{x: string, y?: number}`, etc.

The same type language is used for both `.ts` and JSDoc in `.js`, and is translated to
GCC-compatible annotations internally where needed.

## Types and values in the same space

To make TypeScript and JSDoc interop seamless, **types and runtime values live in the same
namespace** in `kdts`. There is no language-level separation: a declaration file (e.g. `.d.js`
or `.d.ts`) can export both types and values, and the same import can refer to either.

Type-only references are represented as empty type-marker objects in the compiled graph. It is
**the optimizer’s job** to remove them. The compiler treats eliminating these markers **the same
as any other empty or dead object**—no special case. That keeps the design uniform and lets
advanced optimization passes handle type erasure like any other dead-code elimination.

## Declaration files

Type (and value) declarations live in files that end with **`.d.js`** or **`.d.ts`**. For
packages, `kdts` looks for externs under `node_modules/@kimlikdao/lib/kdts/externs/` with the
`.d.js` extension. In `.d.js` files you do not need an explicit `@externs` annotation; it is
injected when missing.

## Running kdts

Direct run:

```shell
bun kdts/kdts.ts entry.ts
```

or install globally:

```shell
cd kdts
npm i -g .
```

Then:

```shell
kdts entry.ts
```

`kdts` crawls all imports from the entry file and pulls in the corresponding declaration files
for libraries it knows about.

```text
kdts 0.0.2

Usage: kdts entry.js [parameters]

Parameters:
  --fast         : Use Bun bundler (way faster, but larger output)
  --output (-o)  : The name of the output file
  --print        : Print the compiled code to stdout
  --strict       : Report unknown type
  --loose        : Don't perform strictTypeCheck
  --nologs       : Strip all console.log() calls
  --define       : Values for @define annotated variables
  --isolateDir   : Directory name to write the isolated and preprocessed input files
  --globals      : A JSON encoded object to be used as globals
```

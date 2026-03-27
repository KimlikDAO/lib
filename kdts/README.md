# `kdts`

`kdts` is a new TypeScript compiler with optimization focus.

It is built around a simple idea: type information should help optimization,
not disappear before optimization even begins. Most current build pipelines
erase types very early and then optimize plain JavaScript. `kdts` tries to keep
type information around long enough to guide optimization and minification.

On our codebase, this currently leads to roughly 50% smaller output.

## Why `kdts` Exists

We use Google Closure Compiler because it is a great compiler. It is still one
of the strongest JavaScript optimizers available.

The problem is not the optimizer. The problem is the frontend. Closure's syntax
and type system are powerful, but writing directly against them is painful and
rarely ergonomic in a modern codebase.

`kdts` is our answer to that. It provides a TypeScript-first frontend for
Closure Compiler so we can write normal code, preserve useful type information
deeper into the pipeline, and still benefit from serious optimization.

## TypeScript First

`kdts` is now primarily a **TypeScript compiler**.

It also supports a JavaScript variant we internally call **`kdjs`**:

- type expressions are written with TypeScript syntax inside JSDoc
- types are imported using normal ES module syntax

## Current Status

`kdts` currently supports a growing subset of TypeScript, with more support
added continuously.

It should not be read as a drop-in replacement for all of `tsc`. The project is
still evolving, and the supported subset expands over time.

## Type Semantics

`kdts` makes a deliberate distinction here:

- **classes and interfaces are nominal**
- **object literal types are structural**

It gives the compiler stronger information and leads to
better optimizations on our workloads. We may re-evaluate this choice later,
but for now it is part of the design.

## Running `kdts`

From this repository:

```sh
bun kdts/kdts.ts entry.ts
```

Current CLI:

```text
kdts 0.0.3

Usage: kdts entry.js [parameters]

Parameters:
  --fast         : Use Bun bundler (way faster, but larger output)
  --output (-o)  : The name of the output file
  --print        : Print the compiled code to stdout
  --strict       : Report unknown types
  --loose        : Don't perform strictCheckTypes
  --nologs       : Strip all console.log() calls
  --define       : Values for @define annotated variables
  --isolateDir   : Directory name to write the isolated and preprocessed input files
  --globals      : A JSON encoded object to be used as globals
```

## Notes

- The default path aims for the smallest output.
- `--fast` uses the Bun bundler path. It is much faster, but usually produces larger output.
- If you hit unsupported TypeScript syntax, that usually means the supported subset has not reached that feature yet.

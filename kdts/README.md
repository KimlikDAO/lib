# kdts

`kdts` is an optimization-first TypeScript compiler. Instead of erasing types
as early as possible, it uses them throughout the compilation to direct
optimizations, achieving transformations that would not have been possible were
the types not known.

## Install

```sh
bun add -g @kimlikdao/kdts
```

Requires Bun `>= 1.3.0`.

## Usage

```sh
kdts src/main.ts
kdts run src/main.ts
kdts test
kdts bench
```

- `kdts <entry>` or `kdts compile <entry>` compiles an entry file
- `kdts run <entry>` compiles and runs an entry file
- `kdts test [target]` compiles matching test files and runs them
- `kdts bench [target]` compiles matching benchmarks and runs them

Run `kdts --help` for the full option list.

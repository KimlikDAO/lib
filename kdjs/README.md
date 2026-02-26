# `kdjs`: KimlikDAO JavaScript compiler

`kdjs` is a javascript compiler with advanced optimization and minification
capabilities.
It primarily builds upon the Google Closure Compiler (GCC) however it has many custom optimization
passes and a more powerful module system.

For instance, `kdjs` it is able to generate es6 modules with `export`s and unlinked `import`s, which
is not possible with GCC.

`kdjs` expects your code to be fully annotated using the Google Closure
Compiler type annotations. Just like in GCC, your type annotations can be
either in a `.js` file or an externs file, which in `kdjs` has to end with the
extension `.d.js`. In `.d.js` files explicit `@externs` annotations are not
needed.

You can run `kdjs` directly

```shell
bun kdjs/kdjs.js entry.js
```

or install it system wide

```shell
cd kdjs
npm i -g .
```

When you run `kdjs` with a supplied entry file like so

```shell
$ kdjs entry.js
```

it will automatically crawl all the imported files from the entry.js and
include the externs files for libraries that it recognizes.

```shell
$ kdjs

kdjs 0.0.2

Usage: kdjs entry.js [parameters]

Parameters:
  --fast         : Use Bun bundler (way faster, but larger output)
  --output (-o)  : The name of the output file
  --print        : Print the compiled code to stdout
  --strict       : Report unknown type
  --loose        : Don't perform strictTypeCheck
  --nologs       : Strip all console.log() calls
  --define       : Values for @define annotated variables
  --isolateDir   : Directory name to write the isolated and preprocessed input files
  --emit_shebang : Whether to place bun shebang sequence at the beginning of the output
  --globals      : A JSON encoded object to be used as globals
```

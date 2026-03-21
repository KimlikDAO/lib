<h1><img src="https://raw.githubusercontent.com/KimlikDAO/dapp/ana/components/icon.svg" align="top" height="44"> kimlikdao-js</a></h1>

[![Tests](https://img.shields.io/github/actions/workflow/status/KimlikDAO/kimlikdao-js/test.yml?branch=ana)](https://github.com/KimlikDAO/kimlikdao-js/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@kimlikdao/lib.svg)](https://www.npmjs.com/package/@kimlikdao/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![KimlikDAO](https://img.shields.io/badge/Kimlik-DAO-blue)](https://kimlikdao.org)

kimlikdao-js is a repository containing TypeScript and JavaScript modules essential to KimlikDAO projects.
Both our js and ts modules are fully typed using ts type expressions and compiled using [`kdts`](./kdts), our
ts/js compiler with type aware optimizations.

## 🗂️ Features

### Highlights

🪁 [`kastro`](./kastro): Our compile-time focused web-framework

  - React-like .jsx components at zero runtime cost
  - Import css, fonts or images using es6 imports and receive a component

⚙️ [`kdts`](./kdts): KimlikDAO TypeScript compiler

  - A TypeScript compiler that leverages type information to perform advanced optimizations.
  - Seamless js/ts interop including the type system
  - Uses the [Google Closure Compiler](https://github.com/google/closure-compiler)
    as a backend with additional optimization passes.

🗝️ [`crypto`](./crypto): Cryptographic functions and libraries

  - [`arfCurve`](./crypto/arfCurve.ts): An efficient Arf Curve ($y^2 = x^3 + b$) class factory
  - [`weierstrassCurve`](./crypto/weierstrassCurve.ts): A constant time Weierstrass Curve ($y^2 = x^3 + ax + b$) implementation
  - [`wesolowski`](./crypto/wesolowski.ts): Our Wesolowski VDF implementation

🪪 [`did`](./did): Definitions of DID and KPass by KimlikDAO

### Other goodies

🫙 `container`: Cryptographic containers such as Merkle Trees

🧬 `crosschain`: Definitions and structures valid across all blockchains

💎 `ethereum`: Tools for interacting with Ethereum nodes

🪶 `mina`: Tools for working with Mina dApps and nodes.

📡 `protocol`: KimlikDAO protocol definitions and node interfaces

🧰 `util`: Conversion tools and external definitions

## 👩‍💻 Development

```shell
git clone https://github.com/KimlikDAO/kimlikdao-js
cd kimlikdao-js
bun i
```

These commands will clone the repository into your local development
environment and download the packages necessary for the repository to function.
If you don't already have bun installed, you can install it by following the
[official guide](https://bun.sh/docs/installation).

## 🧪 Tests

The tests can be run in two different modes:

- Uncompiled:
  We use `bun`'s test runner, which has a jest-like interface.
  ```shell
  bun test
  ```
- Compiled (using `kdts`):
  We also run the same tests after compiling them with `kdts` first:
  ```shell
  bun run test
  ```
  Note that `kdts` makes aggressive optimizations using the provided
  type information. Running tests in compiled mode is crucial, as
  incorrect type annotations can lead to functionally incorrect output.
  There is also a fast build mode, which doesn't do typechecking
  and produces larger outputs
  ```shell
  bun run test --fast
  ```

To run tests in a specific directory, say `crypto`, you can also do
```shell
bun test crypto # uncompiled
bun run test crypto # compiled, --fast param available
```

## ⏱️ Benchmarks

You can run a single benchmark directly
```shell
bun bench crypto/bench/arfCurve/ladder.bench.ts # --fast param available
```
or compile all of them and benchmark the compiled modules:
```shell
bun bench
```

When run, output will look like this:

![](.github/img/modular.compiled-test.png "Example modular.compiled-test.js output")

![](.github/img/secp256k1.test.png "Example secp256k1/unit.test.js output")

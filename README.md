<h1><img src="https://raw.githubusercontent.com/KimlikDAO/dapp/ana/components/icon.svg" align="top" height="44"> kimlikdao-js</a></h1>

[![Tests](https://img.shields.io/github/actions/workflow/status/KimlikDAO/kimlikdao-js/test.yml?branch=ana)](https://github.com/KimlikDAO/kimlikdao-js/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@kimlikdao/lib.svg)](https://www.npmjs.com/package/@kimlikdao/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![KimlikDAO](https://img.shields.io/badge/Kimlik-DAO-blue)](https://kimlikdao.org)

kimlikdao-js is a repository containing JavaScript modules essential to KimlikDAO projects.

## 🗂️ Features

### Highlights

🪁 [`kastro`](./kastro): Our compile-time focused web-framework

  - React-like .jsx components at zero runtime cost
  - Import css, fonts or images using es6 imports and receive a component

⚙️ [`kdjs`](./kdjs): KimlikDAO JavaScript compiler

  - Fully typed, extending the google closure compiler's type system
  - Type information is used for aggressive optimizations which are not possible otherwise

🗝️ [`crypto`](./crypto): Cryptographic functions and libraries

  - [`arfCurve`](./crypto/arfCurve.js): An efficient Arf Curve ($y^2 = x^3 + b$) class factory
  - [`wesolowski`](./crypto/wesolowski.js): Our Wesolowski VDF implementation

🪪 [`did`](./did): Definitions of DID and KPass by KimlikDAO

### Other goodies

🔌 `api`: Definitions of standard protocols (e.g., jsonrpc, oauth2)

🧬 `crosschain`: Definitions and structures valid across all blockchains

💎 `ethereum`: Tools for interacting with Ethereum nodes

🪶 `mina`: Tools for working with Mina dApps and nodes.

📡 `protocol`: KimlikDAO protocol definitions and node interfaces

🧪 `testing`: Testing utils and runners

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
- Compiled (using `kdjs`):
  We also run the same tests after compiling them with `kdjs` first:
  ```shell
  bun run test
  ```
  Note that `kdjs` makes aggressive optimizations using the provided
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

You can run a benchmark either directly as a regular es6 module
```shell
bun run crypto/bench/arfCurve.bench.js
```
or compile all of them and benchmark the compiled modules:
```shell
bun bench
```

When run, output will look like this:

![](.github/img/modular.compiled-test.png "Example modular.compiled-test.js output")

![](.github/img/secp256k1.test.png "Example secp256k1/unit.test.js output")

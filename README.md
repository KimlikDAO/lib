<h1><img src="https://raw.githubusercontent.com/KimlikDAO/dapp/ana/birim/favicon/icon.svg" align="top" height="44"> kimlikdao-js</a></h1>

[![npm version](https://img.shields.io/npm/v/@kimlikdao/lib.svg)](https://www.npmjs.com/package/@kimlikdao/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

kimlikdao-js is a repository containing JavaScript modules essential for KimlikDAO projects.

# 🗂️ Directories

🔌 `api`: Definitions of standard protocols (e.g., jsonrpc, oauth2)

🧬 `crosschain`: Definitions and structures valid across all blockchains

🗝️ `crypto`: Cryptographic functions and libraries

🪪 `did`: Definitions of DID and KPass by KimlikDAO

💎 `ethereum`: Tools for interacting with Ethereum nodes

✨ `kastro`: Our compile-time focused web-framework

⚙️ `kdjs`: KimlikDAO JavaScript compiler

📡 `node`: Definitions needed when communicating with KimlikDAO protocol nodes

🧪 `testing`: Libraries for writing tests

🧰 `util`: Conversion tools and external definitions

# 👩‍💻 Development

```shell
git clone https://github.com/KimlikDAO/kimlikdao-js
cd kimlikdao-js
bun i
```

These commands will clone the repository into your local development
environment and download the packages necessary for the repository to function.

# 🧪 Tests

The tests can be run in two different modes:

- Uncompiled
  We use `bun`'s test runner, which has a jest-like interface.
  ```shell
  bun test
  ```
- Compiled (using `kdjs`)
  We also run the same tests after compiling them with `kdjs`, which ensures
  the packages are correctly typed and allows us to make measurements on the
  compiled versions of the code.
  ```shell
  bun run.js test
  ```

To run tests in a certain directory, say `crypto`, you can also do
```shell
  bun test crypto # uncompiled
  bun run.js crypto # compiled
```

When run, output will look like this:

![](.github/img/modular.compiled-test.png "Example modular.compiled-test.js output")

![](.github/img/secp256k1.test.png "Example sepc256k1/unit.test.js output")

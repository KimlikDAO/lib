# What is kimlikdao-js?

kimlikdao-js is a repository containing JavaScript modules essential for KimlikDAO projects.

# Directory Structure

`api`: Definitions of standard protocols (e.g., jsonrpc, oauth2)

`birimler`: UI module system

`cloudflare`: Definitions related to the Cloudflare Workers platform

`crosschain`: Definitions and structures valid across all blockchains

`crypto`: Cryptographic functions and libraries

`did`: Definitions of DID and KPass by KimlikDAO

`ethereum`: Tools for interacting with Ethereum nodes

`kdjs`: KimlikDAO JavaScript compiler

`node`: Definitions needed when communicating with KimlikDAO protocol nodes

`testing`: Libraries for writing tests

`util`: Conversion tools and external definitions

# How to Clone?

```shell
git clone https://github.com/KimlikDAO/kimlikdao-js
cd kimlikdao-js
bun i
```

These commands will clone the repository into your local development environment and download the packages necessary for the repository to function.

# Tests

The tests can be run in two different modes:

- Uncompiled
  ```shell
  bun test crypto/test/modular.test.js
  ```
- Compiled (using `kdjs`)
  ```shell
  bun run crypto/test/build.js
  bun test build/crypto/test/modular.test.js
  ```

When run, output will look like this:

![](.github/img/modular.compiled-test.png "Example modular.compiled-test.js output")

![](.github/img/secp256k1.test.png "Example sepc256k1/unit.test.js output")

# What is kimlikdao-js?

kimlikdao-js is a repository containing JavaScript modules essential for KimlikDAO projects.

# Directory Structure

`api`: Definitions of standard protocols (e.g., jsonrpc, oauth2)

`units`: Tools and definitions related to the unit system

`cloudflare`: Definitions related to the Cloudflare Workers platform

`crosschain`: Definitions and structures valid across all blockchains

`crypto`: Cryptographic functions and libraries

`did`: Definitions of DID and KPass by KimlikDAO

`ethereum`: Tools for interacting with Ethereum nodes

`kdc`: KimlikDAO JavaScript compiler

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

Tests

There are two types of tests in this repository:

compiled-test: tests compiled with kdc (KimlikDAO Compiler) and run in either Bun or a browser environment.
bun test: tests run in the Bun environment using the Bun test runner.
How to run compiled-tests?
compiled-test can be compiled with kdc and also run directly in the bun environment. For example, to run crypto/test/modular.compiled-test.js you can either use:

```shell
bun crypto/test/build.js
bun build/crypto/test/modular.compiled-test.js
```

or directly:

```shell
bun crypto/test/modular.compiled-test.js
```

If executed without issues, the output will look like this:

![](.github/img/modular.compiled-test.png "Örnek modular.compiled-test.js çıktısı")

### How to run Bun tests?

To run the Bun tests, simply execute the bun test command. If executed without issues, the output will look like this:

![](.github/img/secp256k1.test.png "Örnek sepc256k1/unit.test.js çıktısı")

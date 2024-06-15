// include crypto/test/poseidon/Makefile
// include crypto/test/secp256k1/Makefile

import { compile } from "../../kdc/compile";
import poseidon from "./poseidon/build";
import secp256k1 from "./secp256k1/build";

export default [
  poseidon,
  ...secp256k1,
  compile({
    inputs: [
      "crypto/test/integration.compiled-test.js",
      "crypto/modular.js",
      "crypto/secp256k1.js",
      "crypto/sha3.js",
      "ethereum/evm.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "testing/vm.js",
      "util/çevir.js"
    ],
    output: "build/crypto/test/integration.compiled-test.js",
  }),
  compile({
    inputs: [
      "crypto/test/modular.compiled-test.js",
      "crypto/modular.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/test/modular.compiled-test.js",
  }),
  compile({
    inputs: [
      "crypto/test/primes.compiled-test.js",
      "crypto/modular.js",
      "crypto/primes.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
    ],
    output: "build/crypto/test/primes.compiled-test.js",
  }),
  compile({
    inputs: [
      "crypto/test/sha3.compiled-test.js",
      "crypto/sha3.js",
      "crypto/test/sha3_orig.js",
      "crypto/test/sha3_prev.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/test/sha3.compiled-test.js",
  }),
  compile({
    inputs: [
      "crypto/test/wesolowski.compiled-test.js",
      "crypto/modular.js",
      "crypto/primes.js",
      "crypto/sha3.js",
      "crypto/wesolowski.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/test/wesolowski.compiled-test.js",
  }),
];

import { compile } from "../../kdc/compile"

export default [
  compile({
    inputs: [
      "crypto/bench/secp256k1.bench.js",
      "crypto/modular.js",
      "crypto/secp256k1.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/bench/secp256k1.bench.js",
  }),
  compile({
    inputs: [
      "crypto/bench/modular.bench.js",
      "crypto/modular.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
    ],
    output: "build/crypto/bench/modular.bench.js",
  }),
  compile({
    inputs: [
      "crypto/bench/wesolowski.bench.js",
      "crypto/modular.js",
      "crypto/primes.js",
      "crypto/sha3.js",
      "crypto/wesolowski.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/bench/wesolowski.bench.js",
  }),
  compile({
    inputs: [
      "crypto/bench/primes.bench.js",
      "crypto/modular.js",
      "crypto/primes.js",
      "crypto/sha3.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/bench/primes.bench.js",
  })
];

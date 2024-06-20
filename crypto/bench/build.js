import { compile } from "../../kdjs/compile";

export default [
  compile({
    entry: "crypto/bench/secp256k1.bench.js",
    output: "build/crypto/bench/secp256k1.bench.js",
  }),
  compile({
    entry: "crypto/bench/modular.bench.js",
    output: "build/crypto/bench/modular.bench.js",
  }),
  compile({
    entry: "crypto/bench/wesolowski.bench.js",
    output: "build/crypto/bench/wesolowski.bench.js",
  }),
  compile({
    entry: "crypto/bench/primes.bench.js",
    output: "build/crypto/bench/primes.bench.js",
  })
];

import { compile } from "../../kdc/compile";
import poseidon from "./poseidon/build";
import secp256k1 from "./secp256k1/build";
import sha3 from "./sha3/build";

export default [
  poseidon,
  ...sha3,
  ...secp256k1,
  compile({
    entry: "crypto/test/integration.compiled-test.js",
    output: "build/crypto/test/integration.compiled-test.js",
  }),
  compile({
    entry: "crypto/test/modular.compiled-test.js",
    output: "build/crypto/test/modular.compiled-test.js",
  }),
  compile({
    entry: "crypto/test/primes.compiled-test.js",
    output: "build/crypto/test/primes.compiled-test.js",
  }),
  compile({
    entry: "crypto/test/wesolowski.test.js",
    output: "build/crypto/test/wesolowski.test.js",
  }),
];

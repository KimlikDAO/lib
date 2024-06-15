import { compile } from "../../kdc/compile";

export default [
  compile({
    inputs: [
      "mina/test/merkleTree.compiled-test.js",
      "crypto/modular.js",
      "crypto/poseidon.js",
      "kdc/externs/nodejs.d.js",
      "mina/merkleTree.js",
      "mina/mina.d.js",
      "testing/assert.js",
      "util/hex.js",
      "util/merkleTree.js",
    ],
    output: "build/mina/test/merkleTree.compiled-test.js"
  }),
  compile({
    inputs: [
      "mina/test/mina.compiled-test.js",
      "crypto/modular.js",
      "crypto/poseidon.js",
      "kdc/externs/nodejs.d.js",
      "mina/mina.d.js",
      "mina/mina.js",
      "testing/assert.js",
      "util/base58.js",
      "util/çevir.js"
    ],
    output: "build/mina/test/mina.compiled-test.js"
  })
];

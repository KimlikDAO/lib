import { compile } from "../../../kdc/compile";

export default [
  compile({
    inputs: [
      "crypto/test/secp256k1/unit.compiled-test.js",
      "crypto/modular.js",
      "crypto/secp256k1.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/test/secp256k1/unit.compiled-test.js"
  }),
  /*compile({
    inputs: [
      "crypto/test/secp256k1/nobleVectors.compiled-test.js",
      "crypto/modular.js",
      "crypto/secp256k1.js",
      "crypto/sha3.js",
      "kdc/externs/fs/promises.d.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/crypto/test/secp256k1/nobleVectors.compiled-test.js"
  })*/
];

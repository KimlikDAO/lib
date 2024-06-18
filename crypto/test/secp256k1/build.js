import { compile } from "../../../kdc/compile";

export default [
  compile({
    entry: "crypto/test/secp256k1/unit.compiled-test.js",
    output: "build/crypto/test/secp256k1/unit.compiled-test.js"
  }),
  compile({
    entry: "crypto/test/secp256k1/nobleVectors.compiled-test.js",
    output: "build/crypto/test/secp256k1/nobleVectors.compiled-test.js"
  })
];

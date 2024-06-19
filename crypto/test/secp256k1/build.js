import { compile } from "../../../kdc/compile";

export default [
  compile({
    entry: "crypto/test/secp256k1/unit.test.js",
    output: "build/crypto/test/secp256k1/unit.test.js"
  }),
  compile({
    entry: "crypto/test/secp256k1/nobleVectors.test.js",
    output: "build/crypto/test/secp256k1/nobleVectors.test.js"
  }),
  compile({
    entry: "crypto/test/secp256k1/conformance.test.js",
    output: "build/crypto/test/secp256k1/conformance.test.js",
  }),
];

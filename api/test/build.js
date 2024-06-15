import { compile } from "../../kdc/compile";

export default compile({
  inputs: [
    "api/test/jsonrpc.compiled-test.js",
    "api/jsonrpc.d.js",
    "api/jsonrpc.js",
    "crypto/modular.js",
    "crypto/secp256k1.js",
    "crypto/sha3.js",
    "ethereum/evm.js",
    "kdc/externs/nodejs.d.js",
    "testing/assert.js",
    "util/çevir.js",
  ],
  output: "build/api/test/jsonrpc.compiled-test.js"
});

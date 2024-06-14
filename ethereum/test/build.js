import { compile } from "../../kdc/compile";

export default Promise.all([
  compile({
    inputs: [
      "ethereum/test/evm.compiled-test.js",
      "crypto/secp256k1.js",
      "crypto/sha3.js",
      "crypto/modular.js",
      "ethereum/evm.js",
      "testing/assert.js",
      "testing/nodejs.d.js",
      "util/çevir.js",
    ],
    output: "build/ethereum/test/evm.compiled-test.js"
  }),
  compile({
    inputs: [
      "ethereum/test/eravm.compiled-test.js",
      "crypto/sha3.js",
      "ethereum/eravm.js",
      "testing/assert.js",
      "testing/nodejs.d.js",
      "util/çevir.js"
    ],
    output: "build/ethereum/test/eravm.compiled-test.js"
  }),
  compile({
    inputs: [
      "ethereum/test/KPass.compiled-test.js",
      "api/jsonrpc.d.js",
      "api/jsonrpc.js",
      "crosschain/chains.js",
      "crypto/modular.js",
      "crypto/secp256k1.js",
      "crypto/sha3.js",
      "ethereum/eth.d.js",
      "ethereum/evm.js",
      "ethereum/KPass.js",
      "ethereum/KPassLite.js",
      "ethereum/logs.d.js",
      "ethereum/provider.d.js",
      "ethereum/provider.js",
      "ethereum/transaction.d.js",
      "testing/assert.js",
      "testing/nodejs.d.js",
      "util/çevir.js",
    ],
    output: "build/ethereum/test/KPass.compiled-test.js"
  })]
);

import { compile } from "../../../kdc/compile";

export default [
  compile({
    inputs: [
      "ethereum/evm/test/types.compiled-test.js",
      "ethereum/evm/opcodes.js",
      "ethereum/evm/types.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js",
    ],
    output: "build/ethereum/evm/test/types.compiled-test.js"
  }),
  compile({
    inputs: [
      "ethereum/evm/test/proxies.compiled-test.js",
      "ethereum/evm/opcodes.js",
      "ethereum/evm/proxies.js",
      "ethereum/evm/types.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js",
    ],
    output: "build/ethereum/evm/test/proxies.compiled-test.js"
  })
];

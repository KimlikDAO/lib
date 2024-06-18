import { compile } from "../../kdc/compile";

export default [
  compile({
    entry: "ethereum/test/evm.compiled-test.js",
    output: "build/ethereum/test/evm.compiled-test.js"
  }),
  compile({
    entry: "ethereum/test/eravm.compiled-test.js",
    output: "build/ethereum/test/eravm.compiled-test.js"
  }),
  compile({
    entry: "ethereum/test/KPass.compiled-test.js",
    externs: [
      "api/jsonrpc.d.js",
      "ethereum/eth.d.js",
      "ethereum/logs.d.js",
      "ethereum/provider.d.js",
      "ethereum/transaction.d.js",
    ],
    output: "build/ethereum/test/KPass.compiled-test.js",
  })
];

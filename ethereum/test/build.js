import { compile } from "../../kdc/compile";

export default [
  compile({
    entry: "ethereum/test/evm.test.js",
    output: "build/ethereum/test/evm.test.js"
  }),
  compile({
    entry: "ethereum/test/eravm.test.js",
    output: "build/ethereum/test/eravm.test.js"
  }),
  compile({
    entry: "ethereum/test/KPass.test.js",
    externs: [
      "api/jsonrpc.d.js",
      "ethereum/eth.d.js",
      "ethereum/logs.d.js",
      "ethereum/provider.d.js",
      "ethereum/transaction.d.js",
    ],
    output: "build/ethereum/test/KPass.test.js",
  })
];

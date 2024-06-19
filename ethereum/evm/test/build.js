import { compile } from "../../../kdc/compile";

export default [
  compile({
    entry: "ethereum/evm/test/types.test.js",
    output: "build/ethereum/evm/test/types.test.js"
  }),
  compile({
    entry: "ethereum/evm/test/proxies.test.js",
    output: "build/ethereum/evm/test/proxies.test.js"
  })
];

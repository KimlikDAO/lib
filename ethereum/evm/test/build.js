import { compile } from "../../../kdc/compile";

export default [
  compile({
    entry: "ethereum/evm/test/types.compiled-test.js",
    output: "build/ethereum/evm/test/types.compiled-test.js"
  }),
  compile({
    entry: "ethereum/evm/test/proxies.compiled-test.js",
    output: "build/ethereum/evm/test/proxies.compiled-test.js"
  })
];

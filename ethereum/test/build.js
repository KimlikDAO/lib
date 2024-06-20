import { compile } from "../../kdjs/compile";

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
    output: "build/ethereum/test/KPass.test.js",
  })
];

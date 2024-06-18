import { compile } from "../../kdc/compile";

export default [
  compile({
    entry: "mina/test/merkleTree.compiled-test.js",
    output: "build/mina/test/merkleTree.compiled-test.js"
  }),
  compile({
    entry: "mina/test/mina.compiled-test.js",
    output: "build/mina/test/mina.compiled-test.js"
  })
];

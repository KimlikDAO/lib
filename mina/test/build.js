import { compile } from "../../kdc/compile";

export default [
  compile({
    entry: "mina/test/merkleTree.test.js",
    output: "build/mina/test/merkleTree.test.js"
  }),
  compile({
    entry: "mina/test/mina.test.js",
    output: "build/mina/test/mina.test.js",
  })
];

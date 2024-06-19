import { compile } from "../../kdc/compile";

export default compile({
  entry: "node/test/ipfs.test.js",
  externs: [
    "node/error.d.js",
    "node/ipfs.d.js",
  ],
  output: "build/node/test/ipfs.test.js"
});

import { compile } from "../../kdc/compile";

export default compile({
  inputs: [
    "node/test/ipfs.compiled-test.js",
    "kdc/externs/nodejs.d.js",
    "node/error.d.js",
    "node/ipfs.d.js",
    "node/ipfs.js",
    "testing/assert.js",
    "util/base58.js",
    "util/çevir.js"
  ],
  output: "build/node/test/ipfs.compiled-test.js"
});

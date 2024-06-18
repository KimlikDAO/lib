import { compile } from "../../kdc/compile"

export default [
  compile({
    entry: "util/test/çevir.compiled-test.js",
    output: "build/util/test/çevir.compiled-test.js"
  }),
  compile({
    entry: "util/test/base58.compiled-test.js",
    output: "build/util/test/base58.compiled-test.js"
  }),
  compile({
    entry: "util/test/promises.compiled-test.js",
    output: "build/util/test/promises.compiled-test.js",
  })
];

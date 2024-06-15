import { compile } from "../../kdc/compile"

export default [
  compile({
    inputs: [
      "util/test/çevir.compiled-test.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/çevir.js"
    ],
    output: "build/util/test/çevir.compiled-test.js"
  }),
  compile({
    inputs: [
      "util/test/base58.compiled-test.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/base58.js",
      "util/çevir.js"
    ],
    output: "build/util/test/base58.compiled-test.js"
  }),
  compile({
    inputs: [
      "util/test/promises.compiled-test.js",
      "kdc/externs/nodejs.d.js",
      "testing/assert.js",
      "util/promises.js",
    ],
    output: "build/util/test/promises.compiled-test.js",
  })
];

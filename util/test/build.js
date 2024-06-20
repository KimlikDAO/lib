import { compile } from "../../kdjs/compile";

export default [
  compile({
    entry: "util/test/çevir.test.js",
    output: "build/util/test/çevir.test.js"
  }),
  compile({
    entry: "util/test/base58.test.js",
    output: "build/util/test/base58.test.js"
  }),
  compile({
    entry: "util/test/promises.test.js",
    output: "build/util/test/promises.test.js",
  })
];

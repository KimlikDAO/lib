import { compile } from "../../../kdjs/compile";

export default [
  compile({
    entry: "crypto/test/sha3/unit.test.js",
    output: "build/crypto/test/sha3/unit.test.js",
  }),
  compile({
    entry: "crypto/test/sha3/conformance.test.js",
    output: "build/crypto/test/sha3/conformance.test.js",
  }),
];

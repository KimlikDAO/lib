import { compile } from "../../../kdc/compile";

export default compile({
  inputs: [
    "crypto/test/poseidon/unit.compiled-test.js",
    "crypto/modular.js",
    "crypto/poseidon.js",
    "kdc/externs/nodejs.d.js",
    "testing/assert.js",
  ],
  output: "build/crypto/test/poseidon/unit.compiled-test.js"
});

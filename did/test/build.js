import { compile } from "../../kdjs/compile";

export default [
  compile({
    entry: "did/test/decryptedSections.test.js",
    output: "build/did/test/decryptedSections.test.js",
  }),
  compile({
    entry: "did/test/section.test.js",
    output: "build/did/test/section.test.js"
  }),
  compile({
    entry: "did/test/verifiableID.test.js",
    output: "build/did/test/verifiableID.test.js"
  })
];

import { compile } from "../../kdc/compile";

export default [
  compile({
    entry: "did/test/decryptedSections.compiled-test.js",
    externs: [
      "crosschain/unlockable.d.js",
      "did/decryptedSections.d.js",
      "did/KPassData.d.js",
      "did/section.d.js",
      "did/verifiableID.d.js",
      "ethereum/encryptedData.d.js",
      "ethereum/ERC721Unlockable.d.js",
      "ethereum/eth.d.js",
      "node/nvi.d.js",
    ],
    output: "build/did/test/decryptedSections.compiled-test.js"
  }),
  compile({
    entry: "did/test/section.compiled-test.js",
    externs: [
      "crosschain/unlockable.d.js",
      "did/decryptedSections.d.js",
      "did/KPassData.d.js",
      "did/section.d.js",
      "did/verifiableID.d.js",
      "ethereum/encryptedData.d.js",
      "ethereum/eth.d.js",
      "node/nvi.d.js",
    ],
    output: "build/did/test/section.compiled-test.js"
  }),
  compile({
    entry: "did/test/verifiableID.compiled-test.js",
    externs: [
      "crosschain/unlockable.d.js",
      "did/decryptedSections.d.js",
      "did/KPassData.d.js",
      "did/section.d.js",
      "did/verifiableID.d.js",
      "ethereum/encryptedData.d.js",
      "ethereum/eth.d.js",
      "node/nvi.d.js",
    ],
    output: "build/did/test/verifiableID.compiled-test.js"
  })
];

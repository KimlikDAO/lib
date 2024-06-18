import { compile } from "../../kdc/compile";

export default compile({
  entry: "crosschain/test/unlockable.compiled-test.js",
  externs: [
    "crosschain/unlockable.d.js",
    "ethereum/encryptedData.d.js",
    "ethereum/eth.d.js",
  ],
  output: "build/crosschain/test/unlockable.compiled-test.js"
});

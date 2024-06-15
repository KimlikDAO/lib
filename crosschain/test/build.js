import { compile } from "../../kdc/compile";

export default compile({
  inputs: [
    "crosschain/test/unlockable.compiled-test.js",
    "crosschain/mock/signer.js",
    "crosschain/signer.js",
    "crosschain/unlockable.d.js",
    "crosschain/unlockable.js",
    "crypto/modular.js",
    "crypto/secp256k1.js",
    "crypto/sha3.js",
    "ethereum/encryptedData.d.js",
    "ethereum/eth.d.js",
    "ethereum/evm.js",
    "kdc/externs/nodejs.d.js",
    "testing/assert.js",
    "testing/vm.js",
    "util/çevir.js",
  ],
  output: "build/crosschain/test/unlockable.compiled-test.js"
});

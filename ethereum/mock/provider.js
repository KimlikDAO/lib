import hex from "../../util/hex";
import evm from "../evm";
import "../provider.d";
import { addr, signWide } from "./signer";

/**
 * @constructor
 * @implements {eth.Provider}
 *
 * @param {bigint} privKey
 */
function MockProvider(privKey) {
  /** @const {bigint} */
  this.privKey = privKey;
}

/**
 * @override
 *
 * @param {!eth.Request} req
 * @return {Promise<string>|Promise<string[]>}
 */
MockProvider.prototype.request = function (req) {
  switch (req.method) {
    case "personal_sign":
      if (/** @type {string} */(req.params[1]).toLowerCase() != addr(this.privKey))
        return Promise.reject(/** @type {!eth.ProviderError} */({
          code: -32602,
          message: "from should be same as current address"
        }));
      /** @const {!TextDecoder} */
      const decoder = new TextDecoder();
      /** @const {string} */
      const message = decoder.decode(hex.toUint8Array(/** @type {string} */(req.params[0]).slice(2)));
      /** @const {bigint} */
      const digest = BigInt("0x" + evm.personalDigest(message));
      return Promise.resolve("0x" + signWide(digest, this.privKey));
  }
  return Promise.reject();
}

/**
 * @return {string}
 */
MockProvider.prototype.getAddress = function () {
  return addr(this.privKey);
}

export { MockProvider };

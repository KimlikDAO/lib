import evm from "../../ethereum/evm";
import vm from "../../testing/vm";
import { Signer } from "../signer";

/**
 * @constructor
 * @implements {Signer}
 *
 * @param {bigint} privKey
 */
function MockSigner(privKey) {
  /** @const {bigint} */
  this.privKey = privKey
}

/**
 * @param {string} message
 * @param {string} address
 * @return {!Promise<string>} the signature
 */
MockSigner.prototype.signMessage = function (message, address) {
  if (address.toLowerCase() != vm.addr(this.privKey))
    return Promise.reject();
  /** @const {bigint} */
  const digest = BigInt("0x" + evm.personalDigest(message));
  return Promise.resolve("0x" + vm.signWide(digest, this.privKey));
}

/**
 * @return {string}
 */
MockSigner.prototype.getAddress = function () {
  return vm.addr(this.privKey);
}

export { MockSigner };

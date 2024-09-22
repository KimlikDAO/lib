import { Wallet } from "ethers";
import { Signer } from "../../crosschain/signer";
import evm from "../evm";

/** @const {!TextEncoder} */
const Encoder = new TextEncoder();

/**
 * An implementation of {@link Signer} using ethers.js for testing purposes.
 *
 * @implements {Signer}
 */
class EthersSigner {
  /**
   * @param {bigint} privKey
   */
  constructor(privKey) {
    /** @const {!Wallet} */
    this.wallet = new Wallet("0x" + evm.uint256(privKey));
  }

  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<eth.CompactSignature>}
   */
  signMessage(message, address) {
    if (this.wallet.address.toLowerCase() !== address.toLowerCase())
      return Promise.reject();
    return this.wallet.signMessage(message)
      .then((sig) => evm.compactSignature(sig));
  }

  /**
   * @return {eth.Address}
   */
  getAddress() {
    return this.wallet.address;
  }

  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<!ArrayBuffer>}
   */
  deriveSecret(message, address) {
    if (this.wallet.address.toLowerCase() !== address.toLowerCase())
      return Promise.reject();
    return this.wallet.signMessage(message)
      .then((sig) => crypto.subtle.digest('SHA-256', Encoder.encode(sig.slice(2))));
  }
}

export { EthersSigner };

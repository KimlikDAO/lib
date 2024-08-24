import { Signer as EvmSigner } from "../../ethereum/mock/signer";
import hex from "../../util/hex";
import { Signer } from "../signer";

/**
 * @extends {EvmSigner}
 * @implements {Signer}
 */
class MockSigner extends EvmSigner {
  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<!ArrayBuffer>}
   */
  deriveSecret(message, address) {
    /** @const {?string} */
    const sig = this.signMessage(message, address)
    if (!sig) return Promise.reject();
    return crypto.subtle.digest("SHA-256", hex.toUint8Array(sig.slice(2)));
  }
}

export { MockSigner };

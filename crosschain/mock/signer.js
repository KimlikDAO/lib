import { MockSigner as EvmSigner } from "../../ethereum/mock/signer";
import { addr as minaAddr } from "../../mina/mock/signer";
import { signMessage } from "../../mina/signer";
import { assertEq } from "../../testing/assert";
import base58 from "../../util/base58";
import { ChainGroup } from "../chains";
import { Signature, Signer } from "../signer";

/**
 * @implements {Signer}
 */
class MockSigner {
  /** @param {bigint} privKey */
  constructor(privKey) {
    /** @const {!EvmSigner} */
    this.evmSigner = new EvmSigner(privKey);
  }

  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<!ArrayBuffer>}
   */
  deriveSecret(message, address) {
    if (address.startsWith("0x"))
      return this.evmSigner.deriveSecret(message, address);

    return this.signMessage(message, address)
      .then((/** Signature */ sig) => crypto.subtle.digest("SHA-256",
        base58.toBytes(/** @type {mina.SignerSignature} */(sig).signature)
      ))
  }

  /**
   * @override
   *
   * @param {string} message
   * @param {string} address
   * @return {!Promise<Signature>}
   */
  signMessage(message, address) {
    if (address.startsWith("0x"))
      return this.evmSigner.signMessage(message, address);

    if (address.startsWith("B62")) {
      /** @const {bigint} */
      const privKey = this.evmSigner.privKey;
      assertEq(address, minaAddr(privKey));
      return Promise.resolve(signMessage(message, privKey));
    }
    return Promise.reject();
  }

  /**
   * @param {ChainGroup} chainGroup
   * @return {string}
   */
  getAddress(chainGroup) {
    return chainGroup == ChainGroup.EVM
      ? this.evmSigner.getAddress()
      : minaAddr(this.evmSigner.privKey);
  }
}

export { MockSigner };

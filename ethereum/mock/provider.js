import { Address } from "../address.d";
import { typedDataHash } from "../contract/EIP712";
import { EIP712TypedData } from "../contract/EIP712.d";
import { Provider } from "../provider";
import { WideSignature } from "../signature.d";
import { addr, signWide } from "./signer";

/**
 * @implements {Provider}
 */
class MockProvider {
  /**
   * @param {bigint} privKey
   */
  constructor(privKey) {
    /** @const {bigint} */
    this.privKey = privKey;
  }

  read(_) { }

  write(_) { }

  whenWritten(_, _then) { }

  /**
   * @param {Address} address
   * @param {EIP712TypedData} typedData
   * @return {Promise<WideSignature>}
   */
  signData(address, typedData) {
    if (address.toLowerCase() != addr(this.privKey))
      return Promise.reject();
    const digest = BigInt("0x" + typedDataHash(typedData));
    return Promise.resolve(signWide(digest, this.privKey));
  }

  /**
   * @return {string}
   */
  getAddress() {
    return addr(this.privKey);
  }
}

export { MockProvider };

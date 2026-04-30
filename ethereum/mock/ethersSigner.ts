import { Wallet } from "ethers";
import { Signer } from "../../crosschain/signer";
import abi from "../abi";
import { Address } from "../address.d";
import signature from "../signature";
import { Signature, WideSignature } from "../signature.d";

const Encoder = new TextEncoder();

/**
 * An implementation of {@link Signer} using ethers.js for testing purposes.
 */
class EthersSigner implements Signer {
  private readonly wallet: Wallet;

  constructor(privKey: bigint) {
    this.wallet = new Wallet("0x" + abi.uint256(privKey));
  }
  signMessage(message: string, address: Address): Promise<Signature> {
    if (this.wallet.address.toLowerCase() != address.toLowerCase())
      return Promise.reject();
    return this.wallet.signMessage(message)
      .then((sig) => signature.fromWide(sig as WideSignature));
  }
  getAddress(): Address {
    return this.wallet.address;
  }
  deriveSecret(message: string, address: Address): Promise<ArrayBuffer> {
    if (this.wallet.address.toLowerCase() != address.toLowerCase())
      return Promise.reject();
    return this.wallet.signMessage(message)
      .then((sig) => crypto.subtle.digest("SHA-256", Encoder.encode(sig.slice(2))));
  }
}

export { EthersSigner };

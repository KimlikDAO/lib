import { MockSigner as EvmSigner } from "../../ethereum/mock/signer";
import { addr as minaAddr } from "../../mina/mock/signer";
import { SignerSignature as MinaSignature } from "../../mina/signature.d";
import { signMessage } from "../../mina/signer";
import base58 from "../../util/base58";
import { Signature, Signer } from "../signer";

class MockSigner extends EvmSigner implements Signer {
  constructor(privKey: bigint) {
    super(privKey);
  }

  override deriveSecret(message: string, address: string): Promise<ArrayBuffer> {
    if (address.startsWith("0x"))
      return super.deriveSecret(message, address);

    return this.signMessage(message, address).then((sig) =>
      crypto.subtle.digest(
        "SHA-256",
        base58.toBytes((sig as MinaSignature).signature)
      )
    );
  }

  override signMessage(message: string, address: string): Promise<Signature> {
    if (address.startsWith("0x"))
      return super.signMessage(message, address);

    if (address.startsWith("B62")) {
      const privKey = this.privKey;
      if (address != minaAddr(privKey))
        return Promise.reject();
      return Promise.resolve(signMessage(message, privKey));
    }
    return Promise.reject();
  }
}

export { MockSigner };

import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";

type Signature = MinaSignature | EthereumSignature;

interface Signer {
  deriveSecret(message: string, address: string): Promise<ArrayBuffer>;
  signMessage(message: string, address: string): Promise<Signature>;
}

export { Signature, Signer };

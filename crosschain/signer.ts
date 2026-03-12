import { Signature as EthereumSignature } from "../ethereum/signature.d";
import { SignerSignature as MinaSignature } from "../mina/signature.d";
import { Address } from "./address";

type Signature = MinaSignature | EthereumSignature;

interface Signer {
  deriveSecret(message: string, address: Address): Promise<ArrayBuffer>;
  signMessage(message: string, address: Address): Promise<Signature>;
}

export { Address, Signature, Signer };
